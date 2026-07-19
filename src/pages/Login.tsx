import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { SCHOOL_NAME, APP_NAME, APP_VERSION } from "../constants";
import { pklService } from "../services/pklService";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { Mail, Lock, LogIn, AlertCircle, ShieldAlert, Sparkles, LogIn as GoogleIcon, Eye, EyeOff } from "lucide-react";
import * as z from "zod";

// Zod Schema for Login Form Validation
const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email wajib diisi" })
    .email({ message: "Format email tidak valid" }),
  password: z
    .string()
    .min(6, { message: "Kata sandi minimal harus 6 karakter" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { loginAsRole, loginWithGoogle, logout, isFirebase } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Fill email field when clicking a demo account
  const handleSelectDemoAccount = (email: string) => {
    setValue("email", email);
    setValue("password", ""); // Clear password so they must type it manually
    setErrorMsg(null);
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const emailLower = data.email.toLowerCase();

      // Check if this account has been deleted by an administrator
      const schoolSettings = await pklService.getSchoolSettings();
      const deletedEmails = schoolSettings.deletedEmails || [];
      if (deletedEmails.some(email => email.toLowerCase() === emailLower)) {
        setErrorMsg("Akun ini telah dihapus atau dinonaktifkan oleh administrator sekolah.");
        setIsSubmitting(false);
        return;
      }

      // Hardcoded Admin check with specific password
      if (emailLower === "wasosergio@gmail.com") {
        if (data.password !== "sansa0910##*") {
          setErrorMsg("Kata sandi salah. Silakan periksa kembali.");
          setIsSubmitting(false);
          return;
        }
        await loginAsRole("admin", emailLower);
        navigate("/dashboard");
        return;
      }

      // Look up if user exists in the database/profiles
      const existingProfile = await pklService.getUserProfileByEmail(emailLower);

      if (existingProfile) {
        // We check the password stored in Firestore!
        const correctPassword = existingProfile.password || 
          (existingProfile.role === "pembimbing" ? "PembimbingSanjaya123" : 
           existingProfile.role === "industri" ? "IndustriSanjaya123" : "SiswaSanjaya123");

        if (data.password !== correctPassword) {
          setErrorMsg("Kata sandi salah. Silakan periksa kembali.");
          setIsSubmitting(false);
          return;
        }
        await loginAsRole(existingProfile.role, emailLower);
      } else {
        // Fallback seeds if they haven't been saved in Firestore yet
        if (emailLower === "siswa@smksanjaya.sch.id") {
          if (data.password !== "SiswaSanjaya123") {
            setErrorMsg("Kata sandi salah. Silakan periksa kembali.");
            setIsSubmitting(false);
            return;
          }
          await loginAsRole("siswa", emailLower);
        } else if (emailLower === "sergiusnono80@guru.smk.belajar.id") {
          if (data.password !== "PembimbingSanjaya123") {
            setErrorMsg("Kata sandi salah. Silakan periksa kembali.");
            setIsSubmitting(false);
            return;
          }
          await loginAsRole("pembimbing", emailLower);
        } else if (emailLower === "penyelia@mitra.com") {
          if (data.password !== "IndustriSanjaya123") {
            setErrorMsg("Kata sandi salah. Silakan periksa kembali.");
            setIsSubmitting(false);
            return;
          }
          await loginAsRole("industri", emailLower);
        } else {
          // Dynamic mock profile creation for other inputs to make it functional
          const isSupervisor = emailLower.includes("guru");
          const isIndustri = emailLower.includes("mitra") || emailLower.includes("penyelia") || emailLower.includes("industri");
          const isAdmin = emailLower.includes("admin");
          const role = isAdmin ? "admin" : isIndustri ? "industri" : isSupervisor ? "pembimbing" : "siswa";
          
          const fallbackPassword = role === "pembimbing" ? "PembimbingSanjaya123" : 
                                   role === "industri" ? "IndustriSanjaya123" : "SiswaSanjaya123";
          
          if (data.password !== fallbackPassword) {
            setErrorMsg("Kata sandi salah. Silakan periksa kembali.");
            setIsSubmitting(false);
            return;
          }
          await loginAsRole(role, emailLower);
        }
      }
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMsg(err?.message || "Login gagal. Silakan periksa kembali email dan kata sandi Anda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const profile = await loginWithGoogle();
      const emailLower = (profile.email || "").toLowerCase();

      // Check if this account has been deleted by an administrator
      const schoolSettings = await pklService.getSchoolSettings();
      const deletedEmails = schoolSettings.deletedEmails || [];
      if (emailLower && deletedEmails.some(email => email.toLowerCase() === emailLower)) {
        setErrorMsg("Akun Google ini telah dihapus atau dinonaktifkan oleh administrator sekolah.");
        await logout();
        setIsSubmitting(false);
        return;
      }

      navigate("/dashboard");
    } catch (err: any) {
      setErrorMsg("Otentikasi Google gagal atau dibatalkan.");
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-150 overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          {/* Brand/Logo Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 bg-[#1565C0] rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-sm mb-4">
              S
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {APP_NAME}
            </h1>
            <p className="text-xs font-semibold text-[#1565C0] uppercase tracking-wider mt-1.5">
              {SCHOOL_NAME}
            </p>
            <p className="text-xs text-gray-400 mt-1 font-mono">{APP_VERSION}</p>
          </div>

          {/* Error Alert Panel */}
          {errorMsg && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <div>
                <p className="font-semibold">Kesalahan Masuk</p>
                <p className="text-xs mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="form-login">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Alamat Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="name@smksanjaya.sch.id"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-[#1565C0] transition-all outline-none ${
                    errors.email ? "border-red-400 focus:ring-red-400" : "border-gray-200"
                  }`}
                  id="input-login-email"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-11 py-3 rounded-xl border bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-[#1565C0] transition-all outline-none ${
                    errors.password ? "border-red-400 focus:ring-red-400" : "border-gray-200"
                  }`}
                  id="input-login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  id="btn-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Standard Login Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1565C0] hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg focus:ring-2 focus:ring-blue-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
              id="btn-login-submit"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Masuk ke Akun
                </>
              )}
            </button>
          </form>

          {/* Google Sign-In Trigger */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400 font-semibold tracking-wider">Atau Masuk Dengan</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm focus:ring-2 focus:ring-gray-100"
            id="btn-login-google"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google Sign-In
          </button>

          {/* Quick Access Sandbox Shortcuts */}
          <div className="mt-8 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3.5 text-xs font-bold text-blue-800 dark:text-blue-400">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-bounce" />
              <span>PILIH AKUN DEMO (Klik untuk Isi Email)</span>
            </div>
            <p className="text-[10.5px] text-gray-600 dark:text-gray-400 mb-3.5 leading-relaxed">
              Klik akun di bawah untuk mengisi alamat email otomatis. Anda wajib memasukkan kata sandi secara manual agar dapat masuk ke akun tersebut.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* ADMIN */}
              <button
                onClick={() => handleSelectDemoAccount("wasosergio@gmail.com")}
                className="text-left text-xs bg-white dark:bg-gray-800 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20 p-3 rounded-lg border border-gray-150 dark:border-gray-700 flex flex-col justify-between transition-colors shadow-xs cursor-pointer group"
                type="button"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <p className="font-bold text-gray-850 dark:text-gray-100 truncate group-hover:text-indigo-600">Admin PKL (Sanjaya)</p>
                  <span className="bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                    Admin
                  </span>
                </div>
                <p className="text-gray-400 font-mono text-[9px] truncate">wasosergio@gmail.com</p>
                <p className="text-[9.5px] text-amber-700 dark:text-amber-400 mt-1 font-semibold">Sandi: sansa0910##*</p>
              </button>

              {/* GURU PEMBIMBING */}
              <button
                onClick={() => handleSelectDemoAccount("sergiusnono80@guru.smk.belajar.id")}
                className="text-left text-xs bg-white dark:bg-gray-800 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20 p-3 rounded-lg border border-gray-150 dark:border-gray-700 flex flex-col justify-between transition-colors shadow-xs cursor-pointer group"
                type="button"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <p className="font-bold text-gray-850 dark:text-gray-100 truncate group-hover:text-indigo-600">Drs. Sergius Nono</p>
                  <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                    Guru
                  </span>
                </div>
                <p className="text-gray-400 font-mono text-[9px] truncate">sergiusnono80@guru.smk...</p>
                <p className="text-[9.5px] text-gray-500 mt-1">Sandi: PembimbingSanjaya123</p>
              </button>

              {/* PEMBIMBING INDUSTRI */}
              <button
                onClick={() => handleSelectDemoAccount("penyelia@mitra.com")}
                className="text-left text-xs bg-white dark:bg-gray-800 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20 p-3 rounded-lg border border-gray-150 dark:border-gray-700 flex flex-col justify-between transition-colors shadow-xs cursor-pointer group"
                type="button"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <p className="font-bold text-gray-850 dark:text-gray-100 truncate group-hover:text-indigo-600">Yosef Sanjaya</p>
                  <span className="bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                    Industri
                  </span>
                </div>
                <p className="text-gray-400 font-mono text-[9px] truncate">penyelia@mitra.com</p>
                <p className="text-[9.5px] text-gray-500 mt-1">Sandi: IndustriSanjaya123</p>
              </button>

              {/* SISWA PKL */}
              <button
                onClick={() => handleSelectDemoAccount("siswa@smksanjaya.sch.id")}
                className="text-left text-xs bg-white dark:bg-gray-800 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20 p-3 rounded-lg border border-gray-150 dark:border-gray-700 flex flex-col justify-between transition-colors shadow-xs cursor-pointer group"
                type="button"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <p className="font-bold text-gray-850 dark:text-gray-100 truncate group-hover:text-indigo-600">Siswa Sanjaya</p>
                  <span className="bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                    Siswa
                  </span>
                </div>
                <p className="text-gray-400 font-mono text-[9px] truncate">siswa@smksanjaya.sch.id</p>
                <p className="text-[9.5px] text-gray-500 mt-1">Sandi: SiswaSanjaya123</p>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default Login;
