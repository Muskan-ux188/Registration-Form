'use server';

/**
 * @fileOverview Checks if an uploaded image is work-appropriate.
 *
 * - imageContentFilter - A function that filters image content for work appropriateness.
 * - ImageContentFilterInput - The input type for the imageContentFilter function.
 * - ImageContentFilterOutput - The return type for the imageContentFilter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImageContentFilterInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ImageContentFilterInput = z.infer<typeof ImageContentFilterInputSchema>;

const ImageContentFilterOutputSchema = z.object({
  isWorkAppropriate: z.boolean().describe('Whether or not the image is work-appropriate.'),
  reason: z.string().optional().describe('The reason why the image is not work-appropriate, if applicable.'),
});
export type ImageContentFilterOutput = z.infer<typeof ImageContentFilterOutputSchema>;

export async function imageContentFilter(input: ImageContentFilterInput): Promise<ImageContentFilterOutput> {
  return imageContentFilterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'imageContentFilterPrompt',
  input: {schema: ImageContentFilterInputSchema},
  output: {schema: ImageContentFilterOutputSchema},
  prompt: `You are an AI that determines whether an image is work-appropriate.  "Work-appropriate" means that the image is suitable for display in a professional environment, and does not contain nudity, violence, or other offensive content.

  Analyze the following image and determine if it is work-appropriate.  If it is not, explain why.

  Image: {{media url=photoDataUri}}
  `,
});

const imageContentFilterFlow = ai.defineFlow(
  {
    name: 'imageContentFilterFlow',
    inputSchema: ImageContentFilterInputSchema,
    outputSchema: ImageContentFilterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
