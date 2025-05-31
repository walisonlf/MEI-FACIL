"use client" // Required for tsparticles and other client-side interactions

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  CheckCircle,
  Zap,
  BarChart2,
  Star,
  Users,
  Mail,
  FileTextIcon,
  DownloadCloud,
  BarChartBig,
  MessageSquare,
  BadgePercent,
} from "lucide-react"
import { useCallback, useMemo } from "react"
import Particles from "react-tsparticles"
import type { Engine } from "tsparticles-engine"
import { loadSlim } from "tsparticles-slim" // or loadFull, if you need more features

const WHATSAPP_NUMBER = "5531991953885"
const SUPPORT_EMAIL = "wfcontabilidade.online@gmail.com"
const MAX_FREE_TRANSACTIONS = 50 // Corrected from 10 to 50 as per previous context

export default function LandingPage() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine) // or loadFull(engine)
  }, [])

  const particlesOptions = useMemo(
    () => ({
      background: {
        // color: { value: "#transparent" }, // Make background transparent
      },
      fpsLimit: 60,
      interactivity: {
        events: {
          onClick: {
            enable: false, // Disable click interaction
            mode: "push",
          },
          onHover: {
            enable: true,
            mode: "repulse", // Make particles move away on hover
          },
          resize: true,
        },
        modes: {
          push: {
            quantity: 4,
          },
          repulse: {
            distance: 100, // Reduced distance for a subtler effect
            duration: 0.4,
          },
        },
      },
      particles: {
        color: {
          value: "hsl(var(--primary))", // Use primary color from CSS variables
        },
        links: {
          color: "hsl(var(--primary))", // Use primary color for links
          distance: 150,
          enable: true,
          opacity: 0.3, // Reduced opacity for links
          width: 1,
        },
        collisions: {
          enable: true,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "bounce",
          },
          random: false,
          speed: 1, // Reduced speed for a calmer effect
          straight: false,
        },
        number: {
          density: {
            enable: true,
            area: 800, // Standard density
          },
          value: 50, // Reduced number of particles
        },
        opacity: {
          value: 0.3, // Reduced opacity for particles
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: 3 }, // Smaller particle size
        },
      },
      detectRetina: true,
    }),
    [],
  )

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-950">
      <Link
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1%2C%20tenho%20interesse%20no%20MEI%20F%C3%A1cil!`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg z-50 transition-transform hover:scale-110"
        aria-label="Fale conosco pelo WhatsApp"
      >
        <MessageSquare className="h-7 w-7" />
      </Link>

      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
        <nav className="flex justify-between items-center">
          <Link href="/" className="text-3xl font-bold text-primary flex items-center">
            <BarChartBig className="h-8 w-8 mr-2 text-primary" />
            MEI Fácil
          </Link>
          <div className="space-x-1 sm:space-x-2">
            <Link href="#features">
              <Button
                variant="ghost"
                className="text-slate-700 dark:text-slate-300 hover:bg-primary/10 text-xs sm:text-sm"
              >
                Recursos
              </Button>
            </Link>
            <Link href="#pricing">
              <Button
                variant="ghost"
                className="text-slate-700 dark:text-slate-300 hover:bg-primary/10 text-xs sm:text-sm"
              >
                Planos
              </Button>
            </Link>
            <Link href="#contact">
              <Button
                variant="ghost"
                className="text-slate-700 dark:text-slate-300 hover:bg-primary/10 text-xs sm:text-sm"
              >
                Contato
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm">
                Acessar Painel
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-grow">
        <section className="py-16 md:py-24 relative overflow-hidden">
          {" "}
          {/* Reduced padding for hero section */}
          <Particles
            id="tsparticles"
            init={particlesInit}
            options={particlesOptions as any}
            className="absolute inset-0 z-0"
          />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {" "}
            {/* Ensure content is above particles */}
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              {" "}
              {/* Slightly reduced H1 size */}
              Gestão <span className="text-primary">Descomplicada</span> para seu MEI.
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-300">
              {" "}
              {/* Slightly reduced paragraph size */}
              Foque no seu negócio. Deixe que o MEI Fácil cuide das suas finanças, limites e obrigações fiscais com
              inteligência e simplicidade.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              {" "}
              {/* Reduced margin-top */}
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-md shadow-lg transform hover:scale-105 transition-transform" // Adjusted padding and text size
                >
                  Comece Gratuitamente
                </Button>
              </Link>
              <Link href="#pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-3 text-md border-primary text-primary hover:bg-primary/10 hover:text-primary-foreground shadow-lg transform hover:scale-105 transition-transform" // Adjusted padding and text size
                >
                  Conheça os Planos
                </Button>
              </Link>
            </div>
            <div className="mt-12 max-w-4xl mx-auto">
              {" "}
              {/* Reduced margin-top and max-width for image container */}
              <img
                src="/mei-facil-hero-professional.png"
                alt="Demonstração do Painel MEI Fácil em diversos dispositivos"
                className="rounded-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700 w-full h-auto" // Ensure image is responsive
              />
            </div>
          </div>
        </section>

        <section id="features" className="py-16 md:py-24 bg-white dark:bg-slate-800/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100">
                Recursos Poderosos para seu Sucesso
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Desde o controle financeiro até as obrigações fiscais, temos tudo o que você precisa.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <BarChart2 className="h-10 w-10 text-primary" />,
                  title: "Controle de Receitas e Despesas",
                  description: "Registre suas movimentações financeiras de forma intuitiva e mantenha tudo organizado.",
                },
                {
                  icon: <BadgePercent className="h-10 w-10 text-primary" />,
                  title: "Monitoramento do Limite Anual",
                  description: "Acompanhe seu faturamento em tempo real e evite surpresas com o limite do MEI.",
                },
                {
                  icon: <FileTextIcon className="h-10 w-10 text-primary" />,
                  title: "Lembretes de DAS e DASN",
                  description:
                    "Receba alertas para não perder os prazos do DAS mensal e da declaração anual (DASN-SIMEI).",
                },
                {
                  icon: <Zap className="h-10 w-10 text-primary" />,
                  title: "Transações Ilimitadas (Pro)",
                  description: "Usuários Pro podem registrar quantas transações precisarem, sem restrições.",
                },
                {
                  icon: <DownloadCloud className="h-10 w-10 text-primary" />,
                  title: "Exportação de Dados (Pro)",
                  description: "Exporte seus dados financeiros para planilhas (CSV) e PDF com o plano Pro.",
                },
                {
                  icon: <BarChartBig className="h-10 w-10 text-primary" />,
                  title: "Relatórios Avançados (Pro)",
                  description:
                    "Obtenha insights valiosos com relatórios detalhados sobre a saúde financeira do seu MEI.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-8 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center"
                >
                  <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-base">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="py-16 md:py-24 bg-gradient-to-br from-slate-100 to-gray-200 dark:from-slate-900 dark:to-slate-950"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100">
                Planos Flexíveis para seu Crescimento
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Escolha o plano ideal para suas necessidades e comece a simplificar sua gestão hoje mesmo.
              </p>
            </div>
            <div className="flex flex-col lg:flex-row justify-center items-stretch gap-8 lg:gap-12">
              <div className="flex-1 max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700 flex flex-col transform hover:scale-105 transition-transform duration-300">
                <h3 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Gratuito</h3>
                <p className="mt-3 text-slate-600 dark:text-slate-400">Perfeito para dar o primeiro passo.</p>
                <div className="my-8">
                  <span className="text-6xl font-extrabold text-slate-900 dark:text-slate-100">R$0</span>
                  <span className="text-xl font-medium text-slate-500 dark:text-slate-400">/mês</span>
                </div>
                <ul className="space-y-4 text-slate-700 dark:text-slate-300 flex-grow">
                  {[
                    {
                      text: "Controle de Receitas e Despesas",
                      icon: <BarChart2 className="h-5 w-5 text-primary mr-3 shrink-0" />,
                    },
                    {
                      text: "Monitoramento do Limite Anual",
                      icon: <BadgePercent className="h-5 w-5 text-primary mr-3 shrink-0" />,
                    },
                    {
                      text: "Lembretes Mensais de DAS",
                      icon: <FileTextIcon className="h-5 w-5 text-primary mr-3 shrink-0" />,
                    },
                    {
                      text: `Até ${MAX_FREE_TRANSACTIONS} Transações/Mês`,
                      icon: <Zap className="h-5 w-5 text-primary mr-3 shrink-0" />,
                    },
                    { text: "Suporte à Comunidade", icon: <Users className="h-5 w-5 text-primary mr-3 shrink-0" /> },
                  ].map((item) => (
                    <li key={item.text} className="flex items-center text-lg">
                      {item.icon}
                      {item.text}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard" className="mt-10 block">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground py-4 text-xl font-semibold"
                  >
                    Começar Agora
                  </Button>
                </Link>
              </div>
              <div className="flex-1 max-w-lg bg-primary dark:bg-primary text-primary-foreground rounded-2xl shadow-2xl p-8 ring-4 ring-primary/50 dark:ring-primary/70 flex flex-col relative overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <div className="absolute top-0 right-0 -mr-16 -mt-16">
                  <Star className="h-40 w-40 text-white/10 opacity-80 transform rotate-12" />
                </div>
                <span className="absolute top-6 right-6 bg-white/20 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
                  MAIS POPULAR
                </span>
                <h3 className="text-3xl font-semibold">Pro</h3>
                <p className="mt-3 text-white/90">Desbloqueie todo o potencial do MEI Fácil.</p>
                <div className="my-8">
                  <span className="text-6xl font-extrabold">R$19,90</span>
                  <span className="text-xl font-medium text-white/80">/mês</span>
                </div>
                <ul className="space-y-4 text-white/95 flex-grow">
                  {[
                    {
                      text: "Todos os recursos do plano Gratuito",
                      icon: <CheckCircle className="h-5 w-5 text-green-300 mr-3 shrink-0" />,
                    },
                    { text: "Transações Ilimitadas", icon: <Zap className="h-5 w-5 text-green-300 mr-3 shrink-0" /> },
                    {
                      text: "Lembretes Detalhados de DASN-SIMEI",
                      icon: <FileTextIcon className="h-5 w-5 text-green-300 mr-3 shrink-0" />,
                    },
                    {
                      text: "Relatórios Avançados",
                      icon: <BarChartBig className="h-5 w-5 text-green-300 mr-3 shrink-0" />,
                    },
                    {
                      text: "Exportação de Dados (CSV, PDF)",
                      icon: <DownloadCloud className="h-5 w-5 text-green-300 mr-3 shrink-0" />,
                    },
                    {
                      text: "Suporte Prioritário por E-mail & WhatsApp",
                      icon: <Mail className="h-5 w-5 text-green-300 mr-3 shrink-0" />,
                    },
                    {
                      text: "Cadastro Completo do Perfil da Empresa",
                      icon: <CheckCircle className="h-5 w-5 text-green-300 mr-3 shrink-0" />,
                    },
                    {
                      text: "Automação Fiscal (Em Breve)",
                      icon: <CheckCircle className="h-5 w-5 text-green-300 mr-3 shrink-0" />,
                    },
                  ].map((item) => (
                    <li key={item.text} className="flex items-center text-lg">
                      {item.icon}
                      {item.text}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard" className="mt-10 block">
                  <Button
                    size="lg"
                    className="w-full bg-white text-primary hover:bg-slate-100 py-4 text-xl font-semibold"
                  >
                    Assinar Plano Pro
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-16 md:py-24 bg-white dark:bg-slate-800/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">Fale Conosco</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-10">
              Tem alguma dúvida ou precisa de ajuda? Nossa equipe está pronta para te atender.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <Button
                size="lg"
                variant="outline"
                className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/50 dark:hover:text-green-300"
                asChild
              >
                <Link
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20o%20MEI%20F%C3%A1cil`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageSquare className="mr-2 h-5 w-5" /> WhatsApp
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-accent text-accent-focus hover:bg-accent/10 hover:text-accent-hover dark:border-accent dark:text-accent dark:hover:bg-accent/20 dark:hover:text-accent"
                asChild
              >
                <Link href={`mailto:${SUPPORT_EMAIL}`}>
                  <Mail className="mr-2 h-5 w-5" /> E-mail
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-600 dark:text-slate-400">
          <div className="flex justify-center items-center mb-4">
            <BarChartBig className="h-7 w-7 mr-2 text-primary" />
            <span className="text-xl font-semibold text-primary">MEI Fácil</span>
          </div>
          <p>&copy; {new Date().getFullYear()} MEI Fácil. Todos os direitos reservados.</p>
          <p className="mt-1 text-sm">Uma solução moderna para simplificar a vida do Microempreendedor Individual.</p>
        </div>
      </footer>
    </div>
  )
}
