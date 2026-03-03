'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  CheckCircle2,
  Brain,
  Target,
  BarChart3,
  Zap,
  Quote,
  Clock,
  FileText,
  TrendingUp,
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  const testimonials = [
    { quote: "ChartMe a divisé par 10 le temps de création de nos tests.", author: "Marie L.", role: "Responsable Formation" },
    { quote: "L'IA génère des questions pertinentes et adaptées à notre secteur.", author: "Thomas R.", role: "Directeur Pédagogique" },
    { quote: "Nos candidats apprécient la fluidité des évaluations.", author: "Sophie M.", role: "RH Manager" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0a38fd] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-black">
                ChartMe
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-black/60 hover:text-black transition-colors text-sm">Fonctionnalités</a>
              <a href="#process" className="text-black/60 hover:text-black transition-colors text-sm">Comment ça marche</a>
              <a href="#testimonials" className="text-black/60 hover:text-black transition-colors text-sm">Témoignages</a>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <Button asChild className="bg-[#0a38fd] hover:bg-[#0a38fd]/90 text-white">
                  <Link href="/admin/dashboard">
                    Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild className="text-black/70 hover:text-black hover:bg-black/5">
                    <Link href="/auth/login">Connexion</Link>
                  </Button>
                  <Button asChild className="bg-[#0a38fd] hover:bg-[#0a38fd]/90 text-white">
                    <Link href="/auth/login">Commencer</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Light */}
      <section className="relative min-h-screen bg-white pt-16 flex items-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#0a38fd]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#0a38fd]/5 rounded-full blur-[100px]" />
        </div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-5xl">
            <div className="inline-flex items-center gap-2 bg-[#0a38fd]/10 border border-[#0a38fd]/30 text-[#0a38fd] px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Zap className="h-4 w-4" />
              Propulsé par l&apos;IA • Résultats en temps réel
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-black tracking-tight leading-[0.95] mb-8">
              Créer un bon test
              <br />
              <span className="text-[#0a38fd]">ne prend plus</span>
              <br />
              des heures.
            </h1>
            
            <p className="text-xl sm:text-2xl text-black/50 mb-12 max-w-2xl leading-relaxed">
              L&apos;IA génère vos tests de positionnement en quelques minutes.
              Évaluez, analysez et positionnez vos apprenants sans effort.
            </p>
            
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-16">
              <Button size="lg" className="bg-[#0a38fd] hover:bg-[#0a38fd]/90 text-white text-lg px-8 h-14 rounded-xl" asChild>
                <Link href="/auth/login">
                  Créer mon premier test
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" className="border border-black/20 bg-transparent text-black hover:bg-black/5 text-lg px-8 h-14 rounded-xl" asChild>
                <Link href="#process">
                  Voir comment ça marche
                </Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-8 text-black/40 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#0a38fd]" />
                <span>Sans engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#0a38fd]" />
                <span>Configuration en 5 min</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#0a38fd]" />
                <span>Support réactif</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-black/40 text-sm">Découvrir</span>
          <div className="w-6 h-10 border-2 border-black/20 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-black/30 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative bg-black py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {[
              { value: '10x', label: 'Plus rapide que la création manuelle', icon: Zap },
              { value: '500+', label: 'Tests créés par nos utilisateurs', icon: FileText },
              { value: '98%', label: 'Taux de satisfaction client', icon: TrendingUp },
              { value: '24/7', label: 'Plateforme disponible', icon: Clock },
            ].map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0a38fd]/10 mb-4 group-hover:bg-[#0a38fd]/20 transition-colors">
                  <stat.icon className="h-6 w-6 text-[#0a38fd]" />
                </div>
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution Section - White */}
      <section className="relative py-24 lg:py-32 bg-white overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div>
              <span className="text-[#0a38fd] font-semibold text-sm uppercase tracking-wider">Le problème</span>
              <h2 className="text-4xl sm:text-5xl font-bold text-black mt-4 mb-6 leading-tight">
                Vous passez des heures à créer des tests.
              </h2>
              <p className="text-xl text-black/60 leading-relaxed">
                Rédiger des questions pertinentes, équilibrer les niveaux de difficulté, 
                formater les réponses... Tout ça prend un temps précieux que vous pourriez 
                consacrer à vos apprenants.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0a38fd]/5 to-transparent rounded-3xl" />
              <div className="relative bg-gradient-to-br from-black to-black/90 rounded-3xl p-8 lg:p-12">
                <span className="text-[#0a38fd] font-semibold text-sm uppercase tracking-wider">La solution</span>
                <h3 className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-6 leading-tight">
                  ChartMe fait le travail pour vous.
                </h3>
                <ul className="space-y-4">
                  {[
                    'Génération automatique de questions par l\'IA',
                    'Tests personnalisés selon vos critères',
                    'Analyse instantanée des résultats',
                    'Recommandations de positionnement automatiques',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-[#0a38fd] flex-shrink-0 mt-0.5" />
                      <span className="text-white/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Dark */}
      <section id="features" className="relative py-24 lg:py-32 bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 lg:mb-20">
            <span className="text-[#0a38fd] font-semibold text-sm uppercase tracking-wider">Fonctionnalités</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mt-4 mb-6">
              Ce que vous récupérez concrètement.
            </h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">
              Une plateforme complète pour créer, gérer et analyser vos évaluations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: Brain,
                title: 'Génération IA',
                description: 'Notre moteur d\'IA crée des questions pertinentes adaptées à votre secteur et niveau cible.',
              },
              {
                icon: Target,
                title: 'Tests personnalisés',
                description: 'Définissez vos critères de positionnement et laissez l\'IA adapter le contenu.',
              },
              {
                icon: BarChart3,
                title: 'Analyses détaillées',
                description: 'Tableaux de bord complets avec insights sur les performances individuelles et collectives.',
              },
              {
                icon: Zap,
                title: 'Résultats instantanés',
                description: 'Les apprenants reçoivent leur positionnement dès la fin du test.',
              },
              {
                icon: FileText,
                title: 'Rapports exportables',
                description: 'Générez des rapports PDF professionnels pour chaque candidat ou session.',
              },
              {
                icon: Clock,
                title: 'Historique complet',
                description: 'Suivez la progression de vos apprenants dans le temps avec des données précises.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-[#0a38fd]/30 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-[#0a38fd]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#0a38fd]/20 transition-colors">
                  <feature.icon className="h-7 w-7 text-[#0a38fd]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/50 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section - White */}
      <section id="process" className="relative py-24 lg:py-32 bg-white overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 lg:mb-20">
            <span className="text-[#0a38fd] font-semibold text-sm uppercase tracking-wider">Processus</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-black mt-4 mb-6">
              De l&apos;idée au test. En 3 étapes.
            </h2>
            <p className="text-xl text-black/50 max-w-2xl mx-auto">
              Créez et diffusez vos tests de positionnement en quelques minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                step: '01',
                title: 'Définissez vos critères',
                description: 'Configurez les compétences, niveaux et objectifs. L\'IA s\'adapte à vos besoins spécifiques.',
              },
              {
                step: '02',
                title: 'Générez avec l\'IA',
                description: 'En quelques clics, obtenez un test complet avec des questions pertinentes et calibrées.',
              },
              {
                step: '03',
                title: 'Analysez & Positionnez',
                description: 'Recevez des rapports détaillés avec recommandations automatiques pour chaque candidat.',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="relative bg-black rounded-2xl p-8 lg:p-10 h-full border border-white/10">
                  <div className="text-6xl lg:text-7xl font-bold text-[#0a38fd] mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                  <p className="text-white/60 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Dark */}
      <section id="testimonials" className="relative py-24 lg:py-32 bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 lg:mb-20">
            <span className="text-[#0a38fd] font-semibold text-sm uppercase tracking-wider">Témoignages</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mt-4 mb-6">
              Ce que nos clients disent.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="relative bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-[#0a38fd]/30 transition-colors"
              >
                <Quote className="h-10 w-10 text-[#0a38fd] mb-6" />
                <p className="text-white/80 text-lg leading-relaxed mb-8">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#0a38fd]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#0a38fd] font-bold">{testimonial.author[0]}</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">{testimonial.author}</div>
                    <div className="text-white/40 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 lg:py-32 bg-[#0a38fd] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Prêt à gagner du temps ?
            </h2>
            <p className="text-xl text-white/80 mb-10">
              Rejoignez les formateurs qui ont déjà transformé leur façon de créer des évaluations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Button
                size="lg"
                className="bg-white text-[#0a38fd] hover:bg-white/90 text-lg px-10 h-14 rounded-xl font-semibold"
                asChild
              >
                <Link href="/auth/login">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/70 text-sm">
              {['Configuration rapide', 'Pas de carte requise', 'Support inclus'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0a38fd] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-lg font-semibold text-white">
                ChartMe <span className="text-sm font-normal text-white/40">by imi</span>
              </span>
            </div>
            <div className="flex items-center gap-8">
              <a href="#" className="text-white/40 hover:text-white transition-colors text-sm">Mentions légales</a>
              <a href="#" className="text-white/40 hover:text-white transition-colors text-sm">Confidentialité</a>
              <a href="#" className="text-white/40 hover:text-white transition-colors text-sm">Contact</a>
            </div>
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} ChartMe by imi executive solutions
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
