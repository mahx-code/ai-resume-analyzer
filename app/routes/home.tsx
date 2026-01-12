import type { Route } from "./+types/home";
import Navbar from "../components/Navbar";
import ResumeCard from "../components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { useNavigate, Link } from "react-router";
import { useEffect, useState } from "react";

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
  const { auth, kv } = usePuterStore();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setIsLoadingResumes] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate("/auth?next=/");
    }
  }, [auth.isAuthenticated]);

  useEffect(() => {
    const loadResumes = async () => {
      setIsLoadingResumes(true);
      const resumes = (await kv.list("resume-*", true)) as KVItem[];

      const parsedResumes: Resume[] = resumes?.map(
        (resume) => JSON.parse(resume.value) as Resume
      );
      // console.log(parsedResumes);
      setResumes(parsedResumes || []);
      setIsLoadingResumes(false);
    };
    loadResumes();
  }, []);

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Track Your Applications & Resume Ratings</h1>
          {!loadingResumes && resumes?.length === 0 ? (
            <h2>No resumes found. Upload your first resume to get feedback.</h2>
          ) : (
            <h2>
              Upload your resume and get instant feedback on your application
              status and resume ratings.
            </h2>
          )}
        </div>

        {loadingResumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          </div>
        )}

        {!loadingResumes && resumes?.length > 0 && (
          <div className="resumes-section">
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        )}

        {!loadingResumes && resumes?.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 gap-4">
            <Link
              to="/upload"
              className="primary-button w-fit text-xl font-semibold"
            >
              Upload New Resume
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
