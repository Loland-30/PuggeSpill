export type TrialWord = {
    source: string;
    answer: string;
    acceptedAnswers?: string[];
};

export type Trial = {
    id: string;
    language: "spanish" | "japanese";
    title: string;
    level: number;
    questionCount: number;
    passingCorrect: number;
    wordPool: TrialWord[];
};