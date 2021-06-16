import { attachments } from './index'

function uploadFile(file) {
    let form = new FormData();
    form.append("attachment", file);
    return attachments.post('/', form);
}

export { uploadFile };