/**
 * Recipient view page
 * Displays shared thoughts with full context to recipients
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RecipientView } from './RecipientView';
import { getRecipientViewData } from '@/services/share-service';
import { generateMetaTags } from '@/lib/share/link-generator';

interface PageProps {
  params: Promise<{
    shareId: string;
  }>;
}

/**
 * Generate metadata for SEO and social sharing
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareId } = await params;
  const data = await getRecipientViewData(shareId);

  if (!data) {
    return {
      title: 'Share Not Found - Goldfish',
      description: 'This shared thought could not be found.',
    };
  }

  const { thought, note, metadata: shareMetadata } = data;
  const title = note || thought.content.substring(0, 60) + '...';
  const description = `Wonder score: ${(thought.wonderScore || 0).toFixed(2)} • Shared on Goldfish`;

  return {
    title: `${title} - Goldfish`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'Goldfish',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

/**
 * Recipient view page component
 */
export default async function SharedPage({ params }: PageProps) {
  const { shareId } = await params;
  const data = await getRecipientViewData(shareId);

  if (!data) {
    notFound();
  }

  return <RecipientView data={data} shareId={shareId} />;
}
