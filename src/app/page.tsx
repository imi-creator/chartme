'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ClipboardCheck,
  Sparkles,
  BarChart3,
  Users,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
  Brain,
  Target,
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">
                ChartMe <span className="text-sm font-normal text-gray-500">by imi</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <Button asChild>
                  <Link href="/admin/dashboard">
                    Accéder au Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/auth/login">Se connecter</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth/login">Commencer</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />
          <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000" />
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-500" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              Propulsé par l&apos;Intelligence Artificielle
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight mb-6">
              Tests de positionnement, évaluations et quizz{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                intelligents
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Créez, diffusez et analysez des quiz personnalisés grâce à l&apos;IA.
              Évaluez vos apprenants en quelques minutes, pas en quelques heures.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="text-base px-8 h-12" asChild>
                <Link href="/auth/login">
                  Créer mon premier test
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
                <Link href="#fonctionnalites">Découvrir les fonctionnalités</Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: '10x', label: 'Plus rapide' },
              { value: '100%', label: 'Personnalisable' },
              { value: 'IA', label: 'Génération auto' },
              { value: '24/7', label: 'Disponible' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-indigo-600">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Une plateforme complète pour créer, gérer et analyser vos tests de positionnement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'Génération IA',
                description:
                  'Créez des questions pertinentes automatiquement grâce à notre moteur d\'IA avancé.',
              },
              {
                icon: Target,
                title: 'Tests personnalisés',
                description:
                  'Adaptez chaque test à vos besoins spécifiques avec des critères de positionnement sur mesure.',
              },
              {
                icon: BarChart3,
                title: 'Analyses détaillées',
                description:
                  'Obtenez des insights précis sur les performances et le positionnement de chaque apprenant.',
              },
              {
                icon: Users,
                title: 'Gestion des candidats',
                description:
                  'Suivez facilement vos candidats et leur progression à travers les différents tests.',
              },
              {
                icon: Zap,
                title: 'Résultats instantanés',
                description:
                  'Recevez les résultats et recommandations de positionnement en temps réel.',
              },
              {
                icon: Shield,
                title: 'Sécurisé & Conforme',
                description:
                  'Vos données sont protégées et hébergées en conformité avec les normes RGPD.',
              },
            ].map((feature) => (
              <Card
                key={feature.title}
                className="group hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-indigo-100"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                    <feature.icon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Trois étapes simples pour créer et diffuser vos tests de positionnement.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                title: 'Définissez vos critères',
                description:
                  'Configurez les compétences à évaluer, les niveaux de positionnement et les objectifs du test.',
              },
              {
                step: '02',
                title: 'Générez avec l\'IA',
                description:
                  'Laissez notre IA créer des questions pertinentes ou importez vos propres questions.',
              },
              {
                step: '03',
                title: 'Analysez les résultats',
                description:
                  'Recevez des rapports détaillés avec recommandations de positionnement pour chaque candidat.',
              },
            ].map((item, index) => (
              <div key={item.step} className="relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-indigo-200 to-transparent -translate-x-1/2" />
                )}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl font-bold mb-6 shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-16 sm:px-16 sm:py-20">
            <div className="absolute inset-0 -z-10">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Prêt à transformer vos évaluations ?
              </h2>
              <p className="text-lg text-indigo-100 mb-8">
                Rejoignez les formateurs qui utilisent ChartMe pour créer des tests de positionnement
                efficaces et personnalisés.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-white text-indigo-600 hover:bg-indigo-50 text-base px-8 h-12"
                  asChild
                >
                  <Link href="/auth/login">
                    Commencer gratuitement
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 text-indigo-100 text-sm">
                {['Configuration rapide', 'Pas de carte requise', 'Support inclus'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-indigo-400" />
              <span className="text-lg font-semibold text-white">
                ChartMe <span className="text-sm font-normal text-gray-500">by imi</span>
              </span>
            </div>
            <p className="text-sm">
              © {new Date().getFullYear()} ChartMe by imi executive solutions. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
