"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator";
import { checkImage, registerUser } from "@/app/actions";

const formSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
  dob: z.date({
    required_error: "A date of birth is required.",
  }),
  gender: z.enum(["male", "female", "other"], {
    required_error: "You need to select a gender.",
  }),
  profilePicture: z.any().refine(
    (file) => file, "Profile picture is required."
  ).refine(
    (file) => file?.size <= 2 * 1024 * 1024, "File size must be less than 2MB."
  ).refine(
    (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file?.type), "Only JPG, PNG, and WEBP formats are allowed."
  ),
  terms: z.boolean().refine((value) => value === true, {
    message: "You must accept the terms and conditions.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export function RegistrationForm() {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [isImageChecking, setIsImageChecking] = useState(false);
  const [imageCheckResult, setImageCheckResult] = useState<{isWorkAppropriate: boolean; reason?: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      gender: undefined,
      terms: false,
    },
  });

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>, fieldChange: (value: File) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      // Clear previous errors/results
      form.clearErrors("profilePicture");
      setImageCheckResult(null);
      
      fieldChange(file);
      setIsImageChecking(true);

      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUri = reader.result as string;
        setProfilePicPreview(dataUri);
        const result = await checkImage(dataUri);
        setImageCheckResult(result);
        setIsImageChecking(false);
        if (!result.isWorkAppropriate) {
          form.setError("profilePicture", { message: result.reason || "Image is not work-appropriate." });
          toast({ variant: "destructive", title: "Inappropriate Image", description: result.reason });
        } else {
          form.clearErrors("profilePicture");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(data: FormValues) {
    if (imageCheckResult && !imageCheckResult.isWorkAppropriate) {
        toast({
            variant: "destructive",
            title: "Cannot Submit",
            description: "Please upload a work-appropriate profile picture.",
        });
        return;
    }
    if (!profilePicPreview) {
        form.setError("profilePicture", { message: "Profile picture is required." });
        return;
    }

    setIsSubmitting(true);
    const result = await registerUser(data);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Registration successful!",
        description: "Welcome to FormFlow.",
      });
      form.reset();
      setProfilePicPreview(null);
      setImageCheckResult(null);
      setPassword("");
    } else {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: "An error occurred. Please try again.",
      });
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-primary">Vault Of Codes</CardTitle>
        <CardDescription>Enter your details below to register</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} className="focus:ring-accent focus:border-accent"/>
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
                    <Input type="email" placeholder="name@example.com" {...field} className="focus:ring-accent focus:border-accent"/>
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
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setPassword(e.target.value);
                        }}
                        className="focus:ring-accent focus:border-accent"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                  <PasswordStrengthIndicator password={password} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={showConfirmPassword ? "text" : "password"} {...field} className="focus:ring-accent focus:border-accent"/>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of birth</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex items-center space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="male" />
                        </FormControl>
                        <FormLabel className="font-normal">Male</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="female" />
                        </FormControl>
                        <FormLabel className="font-normal">Female</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="other" />
                        </FormControl>
                        <FormLabel className="font-normal">Other</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="profilePicture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Picture</FormLabel>
                   <FormControl>
                      <Input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => handleImageChange(e, field.onChange)}
                        className="file:text-primary file:font-semibold"
                      />
                    </FormControl>
                  <div className="flex items-center gap-4 mt-2">
                    {profilePicPreview && (
                      <div className="relative">
                        <Image
                          src={profilePicPreview}
                          alt="Profile preview"
                          width={80}
                          height={80}
                          className="rounded-full object-cover w-20 h-20 border-2 border-primary/50"
                        />
                        {isImageChecking && <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded-full"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
                        {!isImageChecking && imageCheckResult && (
                          <div className={cn("absolute bottom-0 right-0 rounded-full p-1 border-2 border-background", imageCheckResult.isWorkAppropriate ? 'bg-green-500' : 'bg-destructive')}>
                            {imageCheckResult.isWorkAppropriate ? <CheckCircle className="h-4 w-4 text-white" /> : <AlertCircle className="h-4 w-4 text-white" />}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      <FormDescription>Upload a picture. Max 2MB. JPG, PNG, WEBP allowed.</FormDescription>
                      <FormMessage />
                    </div>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Accept terms and conditions
                    </FormLabel>
                    <FormDescription>
                      You agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6" disabled={isSubmitting || isImageChecking}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Account
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
