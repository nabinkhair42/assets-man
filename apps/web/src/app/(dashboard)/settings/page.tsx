"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Lock,
  Trash2,
  Mail,
  ChevronRight,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ChangePasswordDialog } from "@/components/dialog/change-password-dialog";
import { DeleteAccountDialog } from "@/components/dialog/delete-account-dialog";
import {
  updateProfileSchema,
  type UpdateProfileFormValues,
} from "@/schema/auth-schema";
import { useUpdateProfile } from "@/hooks/use-auth";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0]?.toUpperCase() ?? "?";
}

function ProfileHeader() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16 text-lg">
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {getInitials(user.name, user.email)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground truncate">
            {user.name ?? "Unnamed"}
          </h2>
          {user.emailVerified ? (
            <BadgeCheck className="size-5 text-white" fill="green" />
          ) : (
           <></>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
      </div>
    </div>
  );
}

function SettingsRow({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        {children}
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
    </div>
  );
}

function ProfileSection() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name ?? "",
    },
  });

  const onSubmit = (values: UpdateProfileFormValues) => {
    updateProfile.mutate(values, {
      onSuccess: () => {
        toast.success("Profile updated");
        setIsEditing(false);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Failed to update profile"));
      },
    });
  };

  const handleCancel = () => {
    form.reset({ name: user?.name ?? "" });
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <User className="size-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Profile</h3>
            <p className="text-xs text-muted-foreground">
              Your personal information
            </p>
          </div>
        </div>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 rounded-xl border bg-card p-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={updateProfile.isPending}
                isLoading={updateProfile.isPending}
                loadingText="Saving"
              >
                Save changes
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={updateProfile.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <div className="rounded-xl border bg-card">
          <SettingsRow label="Display name" value={user?.name ?? "Not set"} />
          <Separator />
          <SettingsRow label="Email" value={user?.email ?? ""}>
            {user?.emailVerified ? (
             null
            ) : (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Mail className="size-3.5" />
                <span className="text-xs font-medium">Pending</span>
              </div>
            )}
          </SettingsRow>
          <Separator />
          <SettingsRow
            label="Member since"
            value={
              user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—"
            }
          />
        </div>
      )}
    </div>
  );
}

function SecuritySection() {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
          <Lock className="size-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-medium">Security</h3>
          <p className="text-xs text-muted-foreground">
            Manage your password and account security
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <button
          type="button"
          onClick={() => setShowPasswordDialog(true)}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent/50 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <Lock className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Change password</p>
              <p className="text-xs text-muted-foreground">
                Update your password to keep your account secure
              </p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </div>

      <ChangePasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
      />
    </div>
  );
}

function DangerSection() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10">
          <Trash2 className="size-4 text-destructive" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-destructive">Danger zone</h3>
          <p className="text-xs text-muted-foreground">
            Irreversible and destructive actions
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-destructive/20 bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-medium">Delete account</p>
            <p className="text-xs text-muted-foreground">
              Permanently remove your account and all data
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="mx-auto w-full max-w-xl px-6 py-8 space-y-8">
        <div>
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your account and preferences
          </p>
        </div>

        <ProfileHeader />

        <Separator />

        <ProfileSection />

        <Separator />

        <SecuritySection />

        <Separator />

        <DangerSection />
      </div>
    </div>
  );
}
