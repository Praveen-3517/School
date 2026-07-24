"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { examinationSchema, type ExaminationFormValues } from "@/lib/validation/examination";
import { createExamination } from "@/lib/actions/examination.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface AcademicSession {
  id: string;
  name: string;
}

interface ExaminationFormProps {
  subjects: Subject[];
  sessions: AcademicSession[];
}

export function ExaminationForm({ subjects, sessions }: ExaminationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExaminationFormValues>({
    resolver: zodResolver(examinationSchema),
    defaultValues: {
      name: "",
      academicSessionId: sessions[0]?.id || "",
      startDate: "",
      endDate: "",
      description: "",
      isPublished: false,
      subjects: [
        { subjectId: "", maxMarks: 100, passingMarks: 33, examDate: "" }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subjects",
  });

  async function onSubmit(data: ExaminationFormValues) {
    setIsSubmitting(true);
    try {
      const result = await createExamination(data);
      if (result.success) {
        toast.success("Examination created successfully");
        router.push("/admin/examinations");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create examination");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Exam Details */}
        <Card>
          <CardHeader>
            <CardTitle>Examination Details</CardTitle>
            <CardDescription>Define the basic parameters of the exam.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exam Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Mid-Term Examination 2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="academicSessionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Session *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select session" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sessions.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description / Instructions</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Instructions for teachers and students..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm md:col-span-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Publish Examination
                    </FormLabel>
                    <FormDescription>
                      Published exams are visible to teachers for mark entry and students (if results are declared).
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Subjects Configuration */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Exam Subjects</CardTitle>
              <CardDescription>Add the subjects and their passing criteria for this exam.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ subjectId: "", maxMarks: 100, passingMarks: 33, examDate: "" })}>
              <Plus className="mr-2 h-4 w-4" /> Add Subject
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-4 md:grid-cols-12 items-end border p-4 rounded-md bg-muted/20">
                <div className="md:col-span-4">
                  <FormField
                    control={form.control}
                    name={`subjects.${index}.subjectId`}
                    render={({ field: selectField }) => (
                      <FormItem>
                        <FormLabel>Subject *</FormLabel>
                        <Select onValueChange={selectField.onChange} defaultValue={selectField.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name={`subjects.${index}.maxMarks`}
                    render={({ field: inputField }) => (
                      <FormItem>
                        <FormLabel>Max Marks *</FormLabel>
                        <FormControl>
                          <Input type="number" {...inputField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name={`subjects.${index}.passingMarks`}
                    render={({ field: inputField }) => (
                      <FormItem>
                        <FormLabel>Pass Marks *</FormLabel>
                        <FormControl>
                          <Input type="number" {...inputField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="md:col-span-3">
                  <FormField
                    control={form.control}
                    name={`subjects.${index}.examDate`}
                    render={({ field: inputField }) => (
                      <FormItem>
                        <FormLabel>Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...inputField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="md:col-span-1 flex justify-end pb-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {form.formState.errors.subjects && (
              <p className="text-sm font-medium text-destructive mt-2">
                {form.formState.errors.subjects.root?.message}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Examination
          </Button>
        </div>
      </form>
    </Form>
  );
}
