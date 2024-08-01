import QRCode from 'qrcode'

// With async/await
export const generateQR = async (text: string): Promise<string> => {
  try {
    const qrCode = await QRCode.toDataURL(text);
    return qrCode;
  } catch (err: any) {
    console.error(err);
    return err;
  }
};