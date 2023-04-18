import { useSearchParams, useNavigate } from 'react-router-dom'
import configData from '../config.json'

const Activate = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const gotoLoginPage = () => navigate(configData.PATH.LOGIN)

    fetch(configData.SERVER_URL + configData.PATH.ACTIVATE, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error_message) {
          alert(data.error_message)
        } else {
          alert(data.message)
          gotoLoginPage()
        }
      })
      .catch(err => console.error(err))
}

export default Activate
