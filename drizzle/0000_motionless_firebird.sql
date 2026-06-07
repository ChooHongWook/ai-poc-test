CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "rag_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rag_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_name" varchar(500) NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"embedding_model" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rag_chunks" ADD CONSTRAINT "rag_chunks_document_id_rag_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."rag_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_rag_chunks_embedding" ON "rag_chunks" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists=100);--> statement-breakpoint
CREATE INDEX "idx_rag_chunks_document_id" ON "rag_chunks" USING btree ("document_id");
