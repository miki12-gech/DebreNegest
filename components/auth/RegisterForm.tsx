"use client";

import { useTransition, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { register } from "@/actions/auth/register";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";
import { BookOpen } from "lucide-react";

interface ClassOption {
    id: string;
    name: string;
}

const classIcons: Record<string, string> = {
    "መዝሙር": "🎵",
    "ትምህርቲ": "📖",
    "ኪነጥበብ": "🎨",
    "አባላት ጉዳይ": "👥",
    "ኦዲት እና ኢንስፔክሽን": "📋",
    "ልምዓት": "🌱",
};

const RegisterSchema = z.object({
    fullName: z.string().min(1, { message: "Name is required" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Minimum 6 characters required" }),
    image: z.string().optional(),
    classId: z.string().optional(),
});

export const RegisterForm = () => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [imageUrl, setImageUrl] = useState("");
    const [classes, setClasses] = useState<ClassOption[]>([]);

    useEffect(() => {
        fetch("/api/classes")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setClasses(data);
            })
            .catch(console.error);
    }, []);

    const form = useForm<z.infer<typeof RegisterSchema>>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            image: "",
            classId: "",
        },
    });

    const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
        values.image = imageUrl;

        startTransition(() => {
            register(values)
                .then((data) => {
                    if (data?.error) {
                        toast.error(data.error);
                    }
                    if (data?.success) {
                        toast.success(data.success);
                        router.push("/login");
                    }
                })
                .catch(() => toast.error("Something went wrong"));
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={isPending}
                                        placeholder="John Doe"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={isPending}
                                        placeholder="john.doe@example.com"
                                        type="email"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={isPending}
                                        placeholder="******"
                                        type="password"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Class Selection */}
                    <FormField
                        control={form.control}
                        name="classId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-orthodox-gold" />
                                    Select Your Class (ክፍል)
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a class to join..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id}>
                                                <span className="flex items-center gap-2">
                                                    <span>{classIcons[cls.name] || "📚"}</span>
                                                    <span>{cls.name}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-orthodox-parchment/40 mt-1">
                                    Choose which department you belong to
                                </p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div>
                    <FormLabel>Profile Picture (Optional)</FormLabel>
                    <div className="mt-2 text-center rounded-lg border border-dashed border-gray-300 px-6 py-4">
                        {imageUrl ? (
                            <div className="flex flex-col items-center">
                                <img src={imageUrl} alt="Profile" className="h-24 w-24 rounded-full object-cover" />
                                <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl("")}>Remove</Button>
                            </div>
                        ) : (
                            <UploadDropzone
                                endpoint="imageUploader"
                                onClientUploadComplete={(res) => {
                                    setImageUrl(res[0].url);
                                    toast.success("Image uploaded!");
                                }}
                                onUploadError={(error: Error) => {
                                    toast.error(`ERROR! ${error.message}`);
                                }}
                            />
                        )}
                    </div>
                </div>

                <Button disabled={isPending} type="submit" className="w-full">
                    Create an account
                </Button>
            </form>
        </Form>
    );
};
