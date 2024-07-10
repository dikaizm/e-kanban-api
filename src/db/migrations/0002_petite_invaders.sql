CREATE TABLE `order_parts` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`part_id` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`qty` int NOT NULL,
	`status` varchar(256) NOT NULL,
	`station_list` varchar(256) NOT NULL,
	`start_plan` datetime NOT NULL,
	`finish_plan` datetime NOT NULL,
	`start_actual` datetime,
	`finish_actual` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `order_parts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`description` text NOT NULL,
	`status` varchar(256) NOT NULL,
	`qty` int NOT NULL,
	`created_by` int NOT NULL,
	`start_plan` datetime NOT NULL,
	`finish_plan` datetime NOT NULL,
	`start_actual` datetime,
	`finish_actual` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parts` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`part_number` varchar(15) NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	CONSTRAINT `parts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `order_parts` ADD CONSTRAINT `order_parts_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_parts` ADD CONSTRAINT `order_parts_part_id_parts_id_fk` FOREIGN KEY (`part_id`) REFERENCES `parts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;