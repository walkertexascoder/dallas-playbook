ALTER TABLE `leagues` ADD `approved` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `seasons` ADD `registration_url` text;--> statement-breakpoint
ALTER TABLE `seasons` ADD `visible` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `seasons` ADD `approved` integer DEFAULT true NOT NULL;