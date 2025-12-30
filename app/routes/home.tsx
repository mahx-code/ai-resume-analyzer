import type { Route } from "./+types/home";
import Navbar from "../components/Navbar";
import { resumes } from "../../constants";
import ResumeCard from "../components/ResumeCard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ResuMind" },
    {
      name: "description",
      content:
        "An AI-powered analyzer that instantly decodes resumes to provide actionable insights and optimization scores for job seekers and recruiters.",
    },
  ];
}

export default function Home() {
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Track Your Applications & Resume Ratings</h1>
          <h2>
            Upload your resume and get instant feedback on your application
            status and resume ratings.
          </h2>
        </div>

        {resumes.length > 0 && (
          <div className="resumes-section">
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
