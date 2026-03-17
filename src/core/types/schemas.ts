import { z } from 'zod';

export const CustomComponentChunkSchema = z.object({
  type: z.string().min(1),
  props: z
    .string()
    .refine((v) => {
      try {
        JSON.parse(v);
        return true;
      } catch {
        return false;
      }
    }, 'props must be a valid JSON string'),
});
