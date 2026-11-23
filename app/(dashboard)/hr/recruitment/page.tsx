import RecruitmentOnboardingSection from "@/components/HR/RecruitmentOnboardingSection";


export default function RecruitmentPage() {
    return (
        <div className="min-h-screen bg-[#FAF8F4] px-4 sm:px-6 lg:px-8 py-6">
            <div className="container mx-auto">
                <RecruitmentOnboardingSection initialTab="positions" />
            </div>
        </div>
    );
}