import { Route } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import ArticlePage from '@/pages/portal/ArticlePage'
import ForInterpreters from '@/pages/portal/ForInterpreters'
import ForRequesters from '@/pages/portal/ForRequesters'
import PortalHome from '@/pages/portal/Home'
import HowItWorks from '@/pages/portal/HowItWorks'
import Impact from '@/pages/portal/Impact'
import InterpreterArticles from '@/pages/portal/InterpreterArticles'
import InterpreterProfile from '@/pages/portal/InterpreterProfile'
import Interpreters from '@/pages/portal/Interpreters'
import InterpreterVideos from '@/pages/portal/InterpreterVideos'
import Services from '@/pages/portal/Services'
import Tutorials from '@/pages/portal/Tutorials'
import Contact from '@/pages/portal/Contact'

const PublicRoutes = () => {
  return (
    <Route path="/" element={<PublicLayout />}>
      <Route path="/home" element={<PortalHome />} />
      <Route path="/services" element={<Services />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/impact" element={<Impact />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/for-requesters" element={<ForRequesters />} />
      <Route path="/for-interpreters" element={<ForInterpreters />} />
      <Route path="/interpreters" element={<Interpreters />} />
      <Route path="/interpreters/:slug" element={<InterpreterProfile />} />
      <Route
        path="/interpreters/:slug/videos"
        element={<InterpreterVideos />}
      />
      <Route
        path="/interpreters/:slug/articles"
        element={<InterpreterArticles />}
      />
      <Route
        path="/interpreters/:slug/articles/:articleSlug"
        element={<ArticlePage />}
      />
      <Route path="/tutorials" element={<Tutorials />} />
    </Route>
  )
}

export default PublicRoutes
