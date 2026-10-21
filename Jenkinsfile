// hwanscord-frontend CI/CD:
//   GitHub push (master) → Jenkins (build.kimhwan.kr) → lint/typecheck/tests in `docker build --target test`
//   → image akon47/hwanscord-frontend → Docker Hub → ssh into the VM (10.10.10.75) → docker compose pull/up → smoke test.
// The Dockerfile keeps the `test` stage last so the legacy (non-BuildKit) builder does not re-run it for `--target runtime`.
pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '30'))
    }

    triggers {
        githubPush()
    }

    parameters {
        booleanParam(name: 'SKIP_DEPLOY', defaultValue: false, description: '빌드·푸시만 하고 배포는 건너뜀')
    }

    environment {
        IMAGE                 = 'akon47/hwanscord-frontend'
        TAG                   = "${env.BUILD_NUMBER}"
        GITHUB_CREDENTIALS_ID = 'git-hub'
        DOCKER_CREDENTIALS_ID = 'docker-hub'
        SSH_CREDENTIALS_ID    = 'hwanscord-deploy'
        DEPLOY_HOST           = 'deploy@10.10.10.75'
        DEPLOY_DIR            = '/srv/hwanscord/frontend'
        SSH_OPTS              = '-o StrictHostKeyChecking=no -o ConnectTimeout=15'
        WEB_URL               = 'http://10.10.10.75/'
        HEALTH_URL            = 'http://10.10.10.75/healthz'
    }

    stages {
        stage('Clone') {
            steps {
                git url: 'git@github.com:akon47/hwanscord-frontend.git', branch: 'master', credentialsId: GITHUB_CREDENTIALS_ID, changelog: true
            }
        }

        stage('Test') {
            steps {
                sh 'docker build --pull --target test -t hwanscord-frontend-test:${TAG} .'
            }
            post {
                always {
                    sh 'docker rmi hwanscord-frontend-test:${TAG} >/dev/null 2>&1 || true'
                }
            }
        }

        stage('Build image') {
            steps {
                sh 'docker build --target runtime --build-arg APP_VERSION=${TAG} -t ${IMAGE}:${TAG} -t ${IMAGE}:latest .'
            }
        }

        stage('Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: DOCKER_CREDENTIALS_ID, usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
                    sh '''
                        echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
                        docker push ${IMAGE}:${TAG}
                        docker push ${IMAGE}:latest
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy') {
            when { expression { !params.SKIP_DEPLOY } }
            steps {
                sshagent(credentials: [SSH_CREDENTIALS_ID]) {
                    sh '''
                        ssh ${SSH_OPTS} ${DEPLOY_HOST} "mkdir -p ${DEPLOY_DIR}"
                        tar -C deploy -cf - . | ssh ${SSH_OPTS} ${DEPLOY_HOST} "tar -C ${DEPLOY_DIR} -xmf -"
                        ssh ${SSH_OPTS} ${DEPLOY_HOST} "cd ${DEPLOY_DIR} && chmod +x deploy.sh && APP_TAG=${TAG} ./deploy.sh"
                    '''
                }
            }
        }

        stage('Smoke test') {
            when { expression { !params.SKIP_DEPLOY } }
            steps {
                sh '''
                    for i in $(seq 1 15); do
                        code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 ${WEB_URL} || true)
                        [ "$code" = "200" ] && break
                        sleep 2
                    done
                    [ "$code" = "200" ] || { echo "web returned $code"; exit 1; }
                    version=$(curl -fsS --max-time 10 ${WEB_URL}version.txt)
                    [ "$version" = "${TAG}" ] || { echo "deployed version $version != ${TAG}"; exit 1; }
                    body=$(curl -fsS --max-time 20 ${HEALTH_URL})
                    echo "$body"
                    echo "$body" | grep -q '"status":"ok"' || { echo "api health check through the web proxy failed"; exit 1; }
                '''
            }
        }
    }

    post {
        always {
            sh 'docker image prune -f >/dev/null 2>&1 || true'
        }
    }
}
