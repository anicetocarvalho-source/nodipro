import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, ArrowRight, FolderKanban, BarChart3, Users, Shield } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .max(255, "Email muito longo"),
  password: z
    .string()
    .min(1, "Palavra-passe é obrigatória")
    .min(6, "Palavra-passe deve ter pelo menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const features = [
  {
    icon: FolderKanban,
    title: "Gestão de Projectos",
    description: "Organize e acompanhe todos os seus projectos num só lugar"
  },
  {
    icon: BarChart3,
    title: "Analytics Avançados",
    description: "Visualize métricas e KPIs em tempo real"
  },
  {
    icon: Users,
    title: "Colaboração em Equipa",
    description: "Trabalhe em conjunto de forma eficiente"
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Os seus dados protegidos com encriptação"
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
} as const;

const slideInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
} as const;

const slideInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
} as const;

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
} as const;

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, signIn } = useAuthContext();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/projects", { replace: true });
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onLogin = async (values: LoginFormValues) => {
    setIsLoading(true);
    const { error } = await signIn(values.email, values.password);
    setIsLoading(false);
    if (!error) {
      navigate("/projects", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding & Features */}
      <motion.div 
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={slideInLeft}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          />
          <motion.div 
            className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 w-72 h-72 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Content */}
        <motion.div 
          className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo */}
          <motion.div className="mb-12" variants={itemVariants}>
            <div className="flex items-center gap-3 mb-4">
              <motion.div 
                className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <FolderKanban className="w-7 h-7 text-white" />
              </motion.div>
              <h1 className="text-4xl font-bold tracking-tight">NODIPRO</h1>
            </div>
            <p className="text-xl text-white/80 font-light">
              Plataforma de Gestão de Projectos e Portfólios
            </p>
          </motion.div>

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                className="flex items-start gap-4 group"
                variants={itemVariants}
                whileHover={{ x: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className="w-11 h-11 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors"
                  whileHover={{ scale: 1.1 }}
                >
                  <feature.icon className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-white/70 text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.div 
            className="mt-16 grid grid-cols-3 gap-8"
            variants={containerVariants}
          >
            {[
              { value: "100+", label: "Projectos Geridos" },
              { value: "50+", label: "Equipas Activas" },
              { value: "99%", label: "Satisfação" },
            ].map((stat, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Right Panel - Login Form */}
      <motion.div 
        className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background"
        initial="hidden"
        animate="visible"
        variants={slideInRight}
      >
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <motion.div 
            className="lg:hidden text-center mb-8"
            variants={scaleIn}
            initial="hidden"
            animate="visible"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <motion.div 
                className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <FolderKanban className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <h1 className="text-2xl font-bold text-primary">NODIPRO</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Plataforma de Gestão de Projectos
            </p>
          </motion.div>

          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-xl bg-card">
              <CardContent className="p-8">
                <motion.div 
                  className="mb-8"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.h2 
                    className="text-2xl font-bold text-foreground"
                    variants={itemVariants}
                  >
                    Bem-vindo de volta
                  </motion.h2>
                  <motion.p 
                    className="text-muted-foreground mt-2"
                    variants={itemVariants}
                  >
                    Introduza as suas credenciais para aceder à plataforma
                  </motion.p>
                </motion.div>

                <Form {...loginForm}>
                  <motion.form 
                    onSubmit={loginForm.handleSubmit(onLogin)} 
                    className="space-y-5"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div variants={itemVariants}>
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground font-medium">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="email"
                                  placeholder="seu@email.com"
                                  className="pl-11 h-12 bg-muted/50 border-border/50 focus:bg-background transition-colors"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground font-medium">Palavra-passe</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="password"
                                  placeholder="••••••••"
                                  className="pl-11 h-12 bg-muted/50 border-border/50 focus:bg-background transition-colors"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Button 
                        type="submit" 
                        className="w-full h-12 text-base font-semibold mt-2" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            Entrar na Plataforma
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.form>
                </Form>

                <motion.p 
                  className="mt-8 text-center text-sm text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  Não tem conta? Contacte o administrador do sistema.
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}