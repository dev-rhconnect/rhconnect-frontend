pipeline {
    agent any

    environment {
        IMAGE_NAME  = "rhconnect-frontend"
        COMPOSE_DIR = "/home/mame/rhconnect"
        API_URL     = "http://192.168.20.136:8083/api"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Next.js') {
            steps {
                sh """
                    export PATH=/usr/local/bin:\$PATH
                    echo "NEXT_PUBLIC_API_URL=${API_URL}" > .env.local
                    npm ci
                    npm run build
                """
            }
        }

        stage('Build Docker Image') {
            steps {
                // Patch l'image existante (pas de pull Docker Hub nécessaire)
                sh """
                    cat > /tmp/Dockerfile.frontend.patch << 'EOF'
FROM rhconnect-frontend:latest
USER root
COPY --chown=nextjs:nodejs .next/standalone/ /app/
COPY --chown=nextjs:nodejs .next/static/ /app/.next/static/
COPY --chown=nextjs:nodejs public/ /app/public/
USER nextjs
EOF
                    DOCKER_BUILDKIT=0 docker build \
                        -f /tmp/Dockerfile.frontend.patch \
                        -t ${IMAGE_NAME}:${BUILD_NUMBER} \
                        -t ${IMAGE_NAME}:latest .
                """
            }
        }

        stage('Deploy') {
            steps {
                sh "cd ${COMPOSE_DIR} && docker compose up -d --no-deps frontend"
            }
        }
    }

    post {
        success {
            echo "Frontend déployé — build #${BUILD_NUMBER}"
        }
        failure {
            echo "Échec du pipeline frontend — build #${BUILD_NUMBER}"
        }
    }
}
