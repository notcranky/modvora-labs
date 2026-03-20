import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <p className="text-purple-400 text-sm font-medium tracking-widest uppercase mb-4">404</p>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-5">Page Not Found</h1>
        <p className="text-zinc-500 mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist. Maybe it was moved, or you followed a bad link.
        </p>
        <div className="flex gap-4 justify-center">
          <Button href="/">Back to Home</Button>
          <Button href="/services" variant="outline">View Services</Button>
        </div>
      </div>
    </section>
  );
}
