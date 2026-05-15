import React from "react";

const MobilePage: React.FC = () => {
  return (
    <main className="min-h-[calc(100vh-8rem)] bg-bg text-text px-4 sm:px-6 py-8">
      <section className="max-w-5xl mx-auto animate-fade-up">
        <div className="rounded-2xl bg-surface shadow-3xl p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-sm text-primary font-semibold mb-2">
                CodeBoard Mobile
              </p>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Install CodeBoard on your Android device
              </h1>

              <p className="mt-4 text-text-secondary leading-relaxed">
                Use the mobile version of CodeBoard to read posts, save useful code,
                browse collections, and work with code snippets directly from your phone.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a
                  href="/downloads/codeboard.apk"
                  download
                  className="glow-hover inline-flex justify-center rounded-xl bg-primary hover:bg-primary-hover px-5 py-3 text-text-buttons font-semibold transition-colors"
                >
                  Download APK
                </a>

                <a
                  href="/"
                  className="inline-flex justify-center rounded-xl bg-surface-lite hover:bg-surface-lite-focus px-5 py-3 text-text font-semibold transition-colors"
                >
                  Back to website
                </a>
              </div>
            </div>

            <div className="flex justify-center items-center">
              <img
                src="/iphone-left.png"
                alt="CodeBoard mobile preview"
                className="w-full max-w-[320px] object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-16">

            <div className="rounded-xl bg-surface-lite p-4">
              <h3 className="font-semibold">Same account</h3>
              <p className="text-sm text-text-secondary mt-2">
                Use your existing CodeBoard account on mobile.
              </p>
            </div>

            <div className="rounded-xl bg-surface-lite p-4">
              <h3 className="font-semibold">Code on the go</h3>
              <p className="text-sm text-text-secondary mt-2">
                View, save, and explore code snippets from your phone.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default MobilePage;