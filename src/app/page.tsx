<<<<<<< HEAD
export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Jobify API</h1>
      <p>
        POST <code>/api/pipeline/trigger</code> to run the job discovery
        pipeline.
      </p>
    </main>
  );
=======
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
>>>>>>> main
}
