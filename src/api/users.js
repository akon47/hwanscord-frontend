import { users } from './index'

function fetchUsers() {
    return users.get('/');
}

export { fetchUsers };