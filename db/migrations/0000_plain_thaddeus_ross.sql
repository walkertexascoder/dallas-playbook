CREATE TABLE `leagues` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`organization` text,
	`sport` text NOT NULL,
	`website` text NOT NULL,
	`source` text DEFAULT 'seed' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scrape_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`league_id` integer NOT NULL,
	`scraped_at` text NOT NULL,
	`status` text NOT NULL,
	`changes_detected` integer DEFAULT false NOT NULL,
	`error_message` text,
	FOREIGN KEY (`league_id`) REFERENCES `leagues`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `seasons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`league_id` integer NOT NULL,
	`name` text NOT NULL,
	`sport` text NOT NULL,
	`signup_start` text,
	`signup_end` text,
	`season_start` text,
	`season_end` text,
	`age_group` text,
	`details_url` text,
	`raw_text` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`league_id`) REFERENCES `leagues`(`id`) ON UPDATE no action ON DELETE no action
);
