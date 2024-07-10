ALTER TABLE `order_parts` MODIFY COLUMN `updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `parts` MODIFY COLUMN `updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP;