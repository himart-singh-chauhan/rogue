import React, { useState, useCallback, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ReactLenis } from 'lenis/react'
import Home from './pages/Home'
import LoadingScreen from './components/LoadingScreen'
import ScrollToTop from './components/ScrollToTop'
import FloatingBack from './components/FloatingBack'
import ProtectedRoute from './components/ProtectedRoute'
import { API_URL } from './utils/api'
import './App.css'

const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Shop = lazy(() => import('./pages/Shop'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Challenges = lazy(() => import('./pages/Challenges'))
const Verify = lazy(() => import('./pages/Verify'))
const ChallengeVerify = lazy(() => import('./pages/ChallengeVerify'))
const VerificationProcess = lazy(() => import('./pages/VerificationProcess'))
const FAQ = lazy(() => import('./pages/FAQ'))
const Events = lazy(() => import('./pages/Events'))
const Privacy = lazy(() => import('./pages/Privacy'))
const RecordDetail = lazy(() => import('./pages/RecordDetail'))
const StreamDetail = lazy(() => import('./pages/StreamDetail'))
const Schedule = lazy(() => import('./pages/Schedule'))
const Cart = lazy(() => import('./pages/Cart'))
const EliteMembership = lazy(() => import('./pages/EliteMembership'))
const Streams = lazy(() => import('./pages/Streams'))
const Categories = lazy(() => import('./pages/Categories'))
const Profile = lazy(() => import('./pages/Profile'))
const Rules = lazy(() => import('./pages/Rules'))
const Appeals = lazy(() => import('./pages/Appeals'))
const SubmitEvidenceLearnMore = lazy(() => import('./pages/SubmitEvidenceLearnMore'))
const GlobalRecognitionLearnMore = lazy(() => import('./pages/GlobalRecognitionLearnMore'))
const ExpertAdjudicationLearnMore = lazy(() => import('./pages/ExpertAdjudicationLearnMore'))
const VerificationProtocolLearnMore = lazy(() => import('./pages/VerificationProtocolLearnMore'))
const Terms = lazy(() => import('./pages/Terms'))
const Cookies = lazy(() => import('./pages/Cookies'))
const GlobalLeaderboard = lazy(() => import('./pages/GlobalLeaderboard'))
const LocalLeaderboards = lazy(() => import('./pages/LocalLeaderboards'))
const GlobalRankingsPage = lazy(() => import('./pages/GlobalRankingsPage'))
const MemberProfilePage = lazy(() => import('./pages/MemberProfilePage'))
const ExploreRecords = lazy(() => import('./pages/ExploreRecords'))
const RecordDetailPage = lazy(() => import('./pages/RecordDetailPage'))
const Admin = lazy(() => import('./pages/Admin'))
const AdminGuide = lazy(() => import('./pages/AdminGuide'))
const CertificateVerify = lazy(() => import('./pages/CertificateVerify'))
const SubmissionCheckout = lazy(() => import('./pages/SubmissionCheckout'))

// Site title / description from Admin → System Settings → Global SEO
const applySeo = () => {
  const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL
  fetch(`${base}/settings/public`)
    .then((r) => (r.ok ? r.json() : null))
    .then((s) => {
      if (!s) return
      if (s.seoTitle) document.title = s.seoTitle
      if (s.seoDescription) document.querySelector('meta[name="description"]')?.setAttribute('content', s.seoDescription)
    })
    .catch(() => {})
}
if (typeof window !== 'undefined') applySeo()

// Rewards program: remember a referral link (?ref=CODE) until the visitor signs up on this device
if (typeof window !== 'undefined') {
  try {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref && /^[A-Za-z0-9]{4,20}$/.test(ref)) localStorage.setItem('ampex_ref', ref.toUpperCase())
  } catch { /* storage blocked: the link still works if they sign up straight away */ }
}

function App() {
  const [loading, setLoading] = useState(true)

  const handleFinish = useCallback(() => {
    setLoading(false)
  }, [])

  return (
    <>
      {loading && <LoadingScreen onFinish={handleFinish} />}
      <ReactLenis root>
        <BrowserRouter>
          <ScrollToTop />
          <FloatingBack />
          <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000' }} />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/leaderboards" element={<Navigate to="/leaderboard" replace />} />
            <Route path="/local-leaderboards" element={<LocalLeaderboards />} />
            <Route path="/local-rankings" element={<Navigate to="/local-leaderboards" replace />} />
            <Route path="/records" element={<Navigate to="/explore-records" replace />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/global-rankings" element={<GlobalRankingsPage />} />
            <Route path="/profile/:username" element={<MemberProfilePage />} />
        <Route path="/explore-records" element={<ExploreRecords />} />
        <Route path="/record/:recordId" element={<RecordDetailPage />} />
            <Route path="/global-leaderboard" element={<GlobalLeaderboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/explore" element={<ExploreRecords />} />
            <Route path="/challenge" element={<Challenges />} />
            <Route path="/verify" element={<ProtectedRoute><Verify /></ProtectedRoute>} />
            <Route path="/challenge-verify" element={<ProtectedRoute><ChallengeVerify /></ProtectedRoute>} />
            <Route path="/submission-checkout" element={<ProtectedRoute><SubmissionCheckout /></ProtectedRoute>} />
            <Route path="/process" element={<VerificationProcess />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/events" element={<Events />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/record/:id" element={<RecordDetail />} />
            <Route path="/stream/:id" element={<StreamDetail />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/elite" element={<ProtectedRoute><EliteMembership /></ProtectedRoute>} />
            <Route path="/streams" element={<Streams />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><Admin /></ProtectedRoute>} />
            <Route path="/admin/guide" element={<ProtectedRoute requireAdmin={true}><AdminGuide /></ProtectedRoute>} />
            <Route path="/certificate" element={<CertificateVerify />} />
            <Route path="/certificate/:number" element={<CertificateVerify />} />
            <Route path="/submit-evidence-info" element={<SubmitEvidenceLearnMore />} />
            <Route path="/global-recognition-info" element={<GlobalRecognitionLearnMore />} />
            <Route path="/adjudication-info" element={<ExpertAdjudicationLearnMore />} />
            <Route path="/verification-protocol-info" element={<VerificationProtocolLearnMore />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/appeals" element={<Appeals />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </ReactLenis>
    </>
  )
}

export default App
