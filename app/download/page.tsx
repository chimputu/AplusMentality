import Link from 'next/link';
import { Download, Smartphone, Shield, QrCode, ChevronRight, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';

const APK_URL = '/app-release.apk';
const DOWNLOAD_PAGE_URL = 'https://aplusmentality.vercel.app/download';

async function generateQRCode() {
  try {
    const dataUrl = await QRCode.toDataURL(DOWNLOAD_PAGE_URL, {
      margin: 2,
      width: 200,
      color: { dark: '#1e40af', light: '#ffffff' },
    });
    return dataUrl;
  } catch {
    return null;
  }
}

async function checkApkExists() {
  try {
    const res = await fetch(`https://aplusmentality.vercel.app${APK_URL}`, {
      method: 'HEAD',
      cache: 'no-store',
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

export const metadata = {
  title: 'Download A+ Mentality App',
  description: 'Download the A+ Mentality Android app for offline access to your study materials.',
};

export default async function DownloadPage() {
  const [qrCode, apkExists] = await Promise.all([
    generateQRCode(),
    checkApkExists(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600 text-white mb-6 shadow-lg shadow-blue-600/25">
          <Smartphone className="w-10 h-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Get the A+ Mentality App
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          Access your study materials, videos, and past papers offline. Install the Android app for a faster, more reliable experience.
        </p>

        {/* Download Button */}
        {apkExists ? (
          <a
            href={APK_URL}
            download="APlusMentality.apk"
            className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-8 py-4 rounded-xl shadow-lg shadow-blue-600/25 transition-colors"
          >
            <Download className="w-6 h-6" />
            Download APK
          </a>
        ) : (
          <div className="inline-flex items-center gap-3 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-8 py-4 rounded-xl border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-6 h-6" />
            APK Coming Soon
          </div>
        )}
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-500">
          Android 7.0+ • Trusted Web App
        </p>
      </section>

      {/* Installation Instructions */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
          How to Install
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg mb-4">
              1
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Download the APK
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tap the download button above. Your browser will save the <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">APlusMentality.apk</code> file.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg mb-4">
              2
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Allow Installation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Android may warn about installing from unknown sources. Tap <strong>Settings</strong>, then <strong>Allow</strong> to proceed.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg mb-4">
              3
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Open & Install
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Open the downloaded file, review the permissions, and tap <strong>Install</strong>. The app will appear in your app drawer.
            </p>
          </div>
        </div>
      </section>

      {/* QR Code Section */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium mb-3">
                <QrCode className="w-5 h-5" />
                Scan to Download
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Install on Your Phone
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Scanning this QR code will open the download page on your phone. Perfect for sharing with classmates.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-500" />
                  Open your phone's camera
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-500" />
                  Point it at the QR code
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-500" />
                  Tap the link that appears
                </li>
              </ul>
            </div>
            <div className="shrink-0">
              {qrCode ? (
                <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100">
                  <img src={qrCode} alt="QR code for A+ Mentality download page" width={200} height={200} className="rounded-lg" />
                </div>
              ) : (
                <div className="w-[200px] h-[200px] bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Security Note */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
          <Shield className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-300 mb-1">
              Safe & Trusted
            </h3>
            <p className="text-sm text-green-700 dark:text-green-400">
              This app is a Trusted Web App (TWA) built with Bubblewrap. It runs the same secure website you already use, wrapped in a native Android container. No extra permissions, no data collection beyond what the website already does.
            </p>
          </div>
        </div>
      </section>

      {/* Back to App Link */}
      <section className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          ← Back to A+ Mentality
        </Link>
      </section>
    </div>
  );
}
