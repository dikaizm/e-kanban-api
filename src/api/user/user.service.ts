import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { sign } from 'jsonwebtoken';

import authConfig from '../../config/auth';
import { db } from '../../db';
import { ApiErr } from '../../utils/api-error';
import { AuthResponse, LoginData, NewUser, users as userSchema, UserVerified } from './user.models';

interface UserService {
  login: (data: LoginData) => Promise<AuthResponse>;
  logout: () => void;
  register: (data: NewUser) => Promise<void>;
  refreshToken: (user: UserVerified) => string;
}

/**
 * Logs in a user
 * 
 * @param {LoginData} data - User login data
 * @returns Promise<string>
 */
async function login(data: LoginData): Promise<AuthResponse> {
  try {
    const { email, password, remember } = data;

    const users = await db.select().from(userSchema).where(eq(userSchema.email, email)).limit(1);

    if (users.length === 0) {
      throw ApiErr('Login failed', 401);
    }

    const user = users[0];

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw ApiErr('Login failed', 401);
    }

    const token = sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      authConfig.secret,
      {
        expiresIn: remember ? '30d' : '3d',
      },
    );

    const authRes: AuthResponse = {
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
    
    return authRes;

  } catch (error) {
    throw error;
  }
}

/**
 * Doesn't do anything, yet
 * 
 * @returns void
 */
async function logout() {
  console.log('logout');
}

/**
 * Registers a new user
 * 
 * @param {NewUser} data 
 * @returns Promise<void>
 */
async function register(data: NewUser): Promise<void> {
  try {
    // Check if user already exists
    const users = await db.select().from(userSchema).where(eq(userSchema.email, data.email)).limit(1);
    if (users.length > 0) {
      throw ApiErr('User already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    if (!hashedPassword) throw Error('Failed to hash password');

    data.password = hashedPassword;

    const result = await db.insert(userSchema).values(data);

    if (!result) {
      throw ApiErr('Failed to register');
    }

    console.log('Register success');
  } catch (error) {
    throw error;
  }
}

/**
 * Refreshes a user's token
 * 
 * @param {UserVerified} user - User data
 * @returns string
 */
function refreshToken(user: UserVerified): string {
  try {
    const expireTimeMs = user.exp * 1000;
    const remainingTime = expireTimeMs - Date.now();

    if (remainingTime <= 0) {
      throw ApiErr('Token expired', 401);
    }

    const newToken = sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      authConfig.secret,
      {
        expiresIn: '8h',
      },
    );

    return newToken;
  } catch (error) {
    throw error;
  }
}

export default {
  login,
  logout,
  register,
  refreshToken,
} satisfies UserService;
