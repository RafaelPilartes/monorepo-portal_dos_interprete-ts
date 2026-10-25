import BrowseInterpreters from '@/pages/dashboard/requester/BrowseInterpreters'
import FavoriteInterpreters from '@/pages/dashboard/requester/FavoriteInterpreters'
import MyReviews from '@/pages/dashboard/requester/MyReviews'
import NewRequest from '@/pages/dashboard/requester/NewRequest'
import RequestDetails from '@/pages/dashboard/requester/RequestDetails'
import RequesterLayout from '@/pages/dashboard/requester/RequesterLayout'
import RequesterOverview from '@/pages/dashboard/requester/RequesterOverview'
import RequesterProfile from '@/pages/dashboard/requester/RequesterProfile'
import RequesterRequests from '@/pages/dashboard/requester/RequesterRequests'
import RequesterSettings from '@/pages/dashboard/requester/RequesterSettings'
import RequestHistory from '@/pages/dashboard/requester/RequestHistory'
import { Route } from 'react-router-dom'

const RequesterRoutes = () => {
  return (
    <Route path="/dashboard/requester" element={<RequesterLayout />}>
      <Route path="" element={<RequesterOverview />} />
      <Route path="requests" element={<RequesterRequests />} />
      <Route path="requests/new" element={<NewRequest />} />
      <Route path="requests/:id" element={<RequestDetails />} />
      <Route path="interpreters" element={<BrowseInterpreters />} />
      <Route path="favorites" element={<FavoriteInterpreters />} />
      <Route path="history" element={<RequestHistory />} />
      <Route path="reviews" element={<MyReviews />} />
      <Route path="profile" element={<RequesterProfile />} />
      <Route path="settings" element={<RequesterSettings />} />
    </Route>
  )
}

export default RequesterRoutes
