ALTER TABLE `users` DROP INDEX `users_username_unique`; --> statement-breakpoint
ALTER TABLE `users`
ADD `role` enum(
        'assembly_line_operator',
        'assembly_store_operator',
        'fabrication_operator',
        'manager'
    ) NOT NULL; --> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `username`;