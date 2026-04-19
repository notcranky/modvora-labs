import type { Metadata } from "next";
import UserProfile from '@/components/UserProfile'

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  return {
    title: `@${params.username} — Modvora Labs`,
    description: `View ${params.username}'s car build profile, mods, and build journal on Modvora Labs.`,
  };
}

export default function UserProfilePage({ params }: { params: { username: string } }) {
  return <UserProfile username={params.username} />
}
