# BookLeaf Assignment 1 — Approach

I prioritised the core author-to-support workflow and the admin ticket lifecycle. The application is split into two role-based interfaces that use the same REST API. Authors can see only their own books and tickets; admins can see the full queue, update classifications and priorities, assign work, add private notes and send public responses.

The supplied author and book JSON is loaded directly so the records, publication states and royalty figures are available immediately. I added a small set of clearly labelled illustrative support tickets to make the admin workflow testable on first login. Ticket mutations are persisted in a local JSON store to keep the assignment easy to run without provisioning a database. For production, I would migrate this data to PostgreSQL and add transactions, indexes and an audit trail.

AI support is designed to be helpful but not autonomous. New tickets are classified into the requested categories and given an initial priority. The admin can override those values. Response drafts use the BookLeaf policy knowledge base and only the relevant ticket and book context; a human must edit/review and send the response. The optional `gpt-4o-mini` integration is server-side and reads its key from an environment variable. If the provider is unavailable or no key is configured, rule-based fallbacks keep ticket creation and manual response workflows operational.

I chose short-interval polling rather than WebSockets to reduce setup complexity while still allowing authors to see new replies without refreshing. Attachment selection is represented in the interface, but file storage is not implemented because the assignment marks it as optional.

Given more time, I would add PostgreSQL, persistent user provisioning and password reset, secure attachment storage, event-based updates, automated access-control and AI evaluation tests, pagination, observability and a review-feedback loop for classification quality. The trade-off was to deliver a complete, explainable core flow first rather than add production infrastructure that would make the project harder to run and review.
