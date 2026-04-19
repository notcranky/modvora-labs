import type { Metadata } from "next";
import MyProfile from '@/components/MyProfile'

export const metadata: Metadata = {
  title: "My Profile — Modvora Labs",
  description: "Your public builder profile on Modvora Labs. Showcase your builds and connect with other car enthusiasts.",
};

export default function MyProfilePage() {
  return <MyProfile />
}
