-- libSQL native vector index for semantic search over reflections (Phase 2).
CREATE INDEX IF NOT EXISTS `learning_embeddings_vec_idx` ON `learning_embeddings` (libsql_vector_idx(`embedding`));
