pipeline {
    agent any

    environment {
        IMAGE_NAME = "rhconnect-frontend"
        CONTAINER_NAME = "rhconnect-frontend"
        VM_USER = "ubuntu"
        VM_HOST = "192.168.20.136"
        APP_PORT = "3000"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install dependencies') {
            steps {
                sh 'npm ci --prefer-offline'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Deploy') {
            steps {
                sshagent(credentials: ['jenkins-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${VM_USER}@${VM_HOST} '
                            docker stop ${CONTAINER_NAME} 2>/dev/null || true
                            docker rm   ${CONTAINER_NAME} 2>/dev/null || true
                        '
                        docker save ${IMAGE_NAME}:latest | ssh ${VM_USER}@${VM_HOST} docker load
                        ssh ${VM_USER}@${VM_HOST} '
                            cd /home/ubuntu/rhconnect
                            docker compose up -d --no-deps frontend
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Déploiement frontend réussi — build #${BUILD_NUMBER}"
        }
        failure {
            echo "Échec du pipeline frontend — build #${BUILD_NUMBER}"
        }
    }
}
