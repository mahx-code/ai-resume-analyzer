import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import FileUploader from "../components/FileUploader";
import Toast from "../components/Toast";
import { usePuterStore } from "~/lib/puter";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from "constants/index";
import { useNavigate } from "react-router";

export const meta = () => [
  { title: "Upload Resume" },
  {
    name: "description",
    content: "Drop your resume for an ATS score and improvement tips",
  },
];

export default function Upload() {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate("/auth?next=/");
    }
  }, [auth.isAuthenticated]);
  const handleFileSelect = (file: File | null) => {
    setFile(file);
    if (file) setError(null);
  };

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    setIsProcessing(true);
    setStatusText("Uploading the file...");
    const uploadedFile = await fs.upload([file]);
    if (!uploadedFile) return setStatusText("Error uploading file");
    setStatusText("Converting to image...");

    const imageFile = await convertPdfToImage(file);
    if (!imageFile.file)
      return setStatusText(imageFile.error || "Error converting PDF to image");

    setStatusText("Uploading the image...");
    const uploadedImage = await fs.upload([imageFile.file]);
    if (!uploadedImage) return setStatusText("Error uploading image");

    setStatusText("Preparing data...");

    const uuid = generateUUID();

    const data = {
      id: uuid,
      resumePath: uploadedFile.path,
      imagePath: uploadedImage.path,
      companyName,
      jobTitle,
      jobDescription,
      feedback: "",
    };
    await kv.set(`resume-${uuid}`, JSON.stringify(data));
    setStatusText("Analyzing the resume...");
    const feedback = await ai.feedback(
      uploadedFile.path,
      prepareInstructions({ jobTitle, jobDescription })
    );

    if (!feedback) return setStatusText("Error analyzing the resume");

    const feedbackText =
      typeof feedback.message.content === "string"
        ? feedback.message.content
        : feedback.message.content[0].text;

    data.feedback = JSON.parse(feedbackText);

    await kv.set(`resume-${uuid}`, JSON.stringify(data));

    setStatusText("Resume analyzed successfully, redirecting...");

    // console.log(data);
    navigate(`/resume/${uuid}`);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest("form");
    if (!form) return;

    const formData = new FormData(form);
    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;

    if (!file) {
      setError("Please upload a resume to continue");
      return;
    }

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      {error && (
        <Toast message={error} type="error" onClose={() => setError(null)} />
      )}

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>
          {isProcessing ? (
            <>
              <h2>
                {statusText}
                <img src="/images/resume-scan.gif" className="w-full" />
              </h2>
            </>
          ) : (
            <>
              <h2>Drop your resume for an ATS score and improvement tips</h2>
            </>
          )}

          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  placeholder="Company Name"
                  name="company-name"
                  id="company-name"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  placeholder="Job Title"
                  name="job-title"
                  id="job-title"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  placeholder="Job Description"
                  name="job-description"
                  id="job-description"
                  required
                />
              </div>
              <div className="form-div">
                <label>Upload Resume</label>
                <FileUploader
                  onFileSelect={handleFileSelect}
                  selectedFile={file}
                />
              </div>
              <button className="primary-button" type="submit">
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
