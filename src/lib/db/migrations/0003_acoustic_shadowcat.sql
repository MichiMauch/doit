CREATE TABLE `jira_issues` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`jira_id` text NOT NULL,
	`key` text NOT NULL,
	`summary` text NOT NULL,
	`description` text,
	`status` text NOT NULL,
	`priority` text,
	`assignee` text,
	`project` text NOT NULL,
	`issue_type` text NOT NULL,
	`due_date` integer,
	`user_email` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_sync_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `jira_issues_jira_id_unique` ON `jira_issues` (`jira_id`);--> statement-breakpoint
ALTER TABLE `todos` ADD `user_email` text NOT NULL;