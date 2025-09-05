"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AlertCircle, Users } from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import Button from "@/app/components/Button";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { animationClasses, useAnimation } from "@/app/lib/animations";
import toast from "react-hot-toast";
import { EmployeeQuestions } from "@/app/types";
import { EQuestions } from "@/app/services/api";

type RespMap = Record<string, string>;
type BoolMap = Record<string, boolean>;

const EmployeeQuestionsPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id?: string; taskId?: string }>();
  const isVisible = useAnimation();

  const [questions, setQuestions] = useState<EmployeeQuestions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep server-confirmed values separate from user draft
  const [savedValues, setSavedValues] = useState<RespMap>({});
  const [draftValues, setDraftValues] = useState<RespMap>({});
  const [savingByKey, setSavingByKey] = useState<BoolMap>({});

  const qKey = (qId: string | number | undefined) => String(qId ?? "");

  const getInitialResp = (q: EmployeeQuestions): string => {
    // Normalize possible response fields coming from backend
    const v =
      (q as any).answer ??
      (q as any).responseValue ??
      (q as any).userResponse ??
      (typeof (q as any).response === "string" &&
      (q as any).response.toLowerCase() !== "text"
        ? (q as any).response
        : "");
    return (v ?? "").toString();
  };

  const isTextType = useCallback(
    (q: EmployeeQuestions) =>
      String(q.responseType ?? "").toLowerCase() === "text",
    []
  );

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        throw new Error("No user in localStorage");
      }
      const user = JSON.parse(storedUser); 
      const userId = user.id; 
      const resp = await EQuestions.getEmployeeQuestions(userId, 0);

      const list: EmployeeQuestions[] = Array.isArray(resp?.commonListDto)
        ? resp.commonListDto
        : Array.isArray(resp?.commonListDto)
        ? resp.commonListDto
        : [];

      setQuestions(list);

      const initSaved: RespMap = {};
      const initDraft: RespMap = {};
      for (const q of list) {
        const key = qKey(q.id);
        const v = getInitialResp(q);
        initSaved[key] = v;
        initDraft[key] = v;
      }
      setSavedValues(initSaved);
      setDraftValues(initDraft);
    } catch (e) {
      console.error("Error fetching Employee Questions", e);
      setError("Failed to load Employee Questions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Auth guards
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (user.role !== "employee") {
      router.push("/");
      return;
    }
    void loadQuestions();
  }, [user, router, loadQuestions]);

  const saveQuestionResponse = useCallback(
    async (q: EmployeeQuestions, value: string) => {
      const key = qKey(q.id);
      try {
        setSavingByKey((s) => ({ ...s, [key]: true }));
        // Ensure your API signature matches (id, value)
        await EQuestions.saveResponse(q.id, value);
        setSavedValues((sv) => ({ ...sv, [key]: value }));
        toast.success("Response saved");
      } catch (e: any) {
        toast.error(e?.response?.data?.message ?? "Failed to save response");
        // Optional: revert draft to last saved if server rejected update
        setDraftValues((dv) => ({ ...dv, [key]: savedValues[key] ?? "" }));
      } finally {
        setSavingByKey((s) => ({ ...s, [key]: false }));
      }
    },
    [savedValues]
  );

  const onChangeDraft = useCallback((key: string, v: string) => {
    setDraftValues((dv) => ({ ...dv, [key]: v }));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Could not load
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => loadQuestions()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-background ${
        isVisible ? animationClasses.fadeIn : "opacity-0"
      }`}
    >
      <Card>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Response</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={48} className="text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No questions found.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                questions.map((q) => {
                  const key = qKey(q.id);
                  const draft = draftValues[key] ?? "";
                  const saved = savedValues[key] ?? "";
                  const saving = savingByKey[key] === true;

                  const questionText =
                    (q as any).questions ?? (q as any).question ?? `Q${q.id}`;

                  return (
                    <TableRow key={key}>
                      <TableCell className="font-medium">
                        {questionText}
                        <div className="text-xs text-muted-foreground">
                          {isTextType(q) ? "Text" : "Yes/No"}
                        </div>
                      </TableCell>

                      <TableCell className="min-w-[260px]">
                        {isTextType(q) ? (
                          <input
                            type="text"
                            className="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
                            placeholder="Type response and leave the field"
                            value={draft}
                            onChange={(e) => onChangeDraft(key, e.target.value)}
                            onBlur={(e) => {
                              const newVal = e.target.value.trim();
                              if (saving) return;
                              if (newVal === saved) return; // compare to SAVED baseline
                              void saveQuestionResponse(q, newVal);
                            }}
                            disabled={saving}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            {(() => {
                              const norm = (saved || "")
                                .toString()
                                .toLowerCase();
                              const isYes =
                                norm === "yes" ||
                                norm === "y" ||
                                norm === "true";
                              const isNo =
                                norm === "no" ||
                                norm === "n" ||
                                norm === "false";

                              return (
                                <>
                                  <Button
                                    type="button"
                                    variant={isYes ? "default" : "outline"}
                                    disabled={saving}
                                    onClick={() => {
                                      onChangeDraft(key, "YES");
                                      void saveQuestionResponse(q, "YES"); // send canonical
                                    }}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={isNo ? "default" : "outline"}
                                    disabled={saving}
                                    onClick={() => {
                                      onChangeDraft(key, "NO");
                                      void saveQuestionResponse(q, "NO");
                                    }}
                                  >
                                    No
                                  </Button>
                                  {saving && (
                                    <span className="text-xs text-muted-foreground">
                                      Saving…
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeQuestionsPage;
