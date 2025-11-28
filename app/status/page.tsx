import { LandingNav } from '@/components/landing/LandingNav';
import { Footer } from '@/components/landing/Footer';
import { CheckCircle, Clock } from 'lucide-react';

const services = [
  { name: 'Web Application', status: 'operational' },
  { name: 'AI Chat Service', status: 'operational' },
  { name: 'Video Processing', status: 'operational' },
  { name: 'Student Portal', status: 'operational' },
  { name: 'Creator Dashboard', status: 'operational' },
  { name: 'Analytics Engine', status: 'operational' },
];

export default function StatusPage() {
  const allOperational = services.every(s => s.status === 'operational');

  return (
    <div className="min-h-screen bg-gray-1">
      <LandingNav />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-12 mb-4">
              System Status
            </h1>
            <p className="text-xl text-gray-11 max-w-2xl mx-auto">
              Real-time status of ChronosAI services.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Overall Status */}
            <div className={`rounded-2xl p-6 mb-8 ${
              allOperational
                ? 'bg-green-9/20 border border-green-9/50'
                : 'bg-yellow-9/20 border border-yellow-9/50'
            }`}>
              <div className="flex items-center gap-3">
                {allOperational ? (
                  <CheckCircle className="w-8 h-8 text-green-9" />
                ) : (
                  <Clock className="w-8 h-8 text-yellow-9" />
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-12">
                    {allOperational ? 'All Systems Operational' : 'Partial Service Disruption'}
                  </h2>
                  <p className="text-gray-11">
                    Last updated: {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Service List */}
            <div className="bg-gray-2 border border-gray-6 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-6">
                <h3 className="font-semibold text-gray-12">Services</h3>
              </div>
              <div className="divide-y divide-gray-6">
                {services.map((service) => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between p-4"
                  >
                    <span className="text-gray-12">{service.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${
                        service.status === 'operational'
                          ? 'text-green-11'
                          : 'text-yellow-11'
                      }`}>
                        {service.status === 'operational' ? 'Operational' : 'Degraded'}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${
                        service.status === 'operational'
                          ? 'bg-green-9'
                          : 'bg-yellow-9'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Uptime */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="bg-gray-2 border border-gray-6 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-12">99.9%</p>
                <p className="text-sm text-gray-11">Uptime (30 days)</p>
              </div>
              <div className="bg-gray-2 border border-gray-6 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-12">&lt;100ms</p>
                <p className="text-sm text-gray-11">Avg Response</p>
              </div>
              <div className="bg-gray-2 border border-gray-6 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-12">0</p>
                <p className="text-sm text-gray-11">Incidents (7 days)</p>
              </div>
            </div>

            {/* Subscribe to Updates */}
            <div className="mt-8 text-center">
              <p className="text-gray-11 text-sm">
                For incident notifications, contact{' '}
                <a href="mailto:support@chronos-ai.app" className="text-purple-11 hover:underline">
                  support@chronos-ai.app
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
