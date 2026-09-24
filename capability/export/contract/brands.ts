/*
 * Identifier and digest schemas used by Export's records. They are plain string checks, not
 * branded types. The exported schemas are shared, unfrozen objects; their `parse` throws a
 * `ZodError`.
 */
import { z } from 'zod';

/**
 * A transferred identifier: 1–120 characters. It keeps the collection-local ID as written;
 * Export never creates domain identities.
 */
export const identity = z.string().min(1).max(120);

/** A SHA-256 digest: exactly 64 lowercase hex characters. */
export const digest = z.string().regex(/^[a-f0-9]{64}$/);
