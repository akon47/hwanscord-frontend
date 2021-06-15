import { avatar } from './index'

function uploadAvatar(file) {
    let form = new FormData();
    form.append("avatar", file);
    return avatar.post('/', form);
}

export { uploadAvatar };