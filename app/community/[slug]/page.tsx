import CommunityPostPage from '@/components/CommunityPostPage'

export const metadata = {
  title: 'Build Showcase | Modvora Labs',
  description: 'Community showcase page for a published build.',
}

export default function CommunityBuildPage({ params }: { params: { slug: string } }) {
  return <CommunityPostPage slug={params.slug} />
}
