pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'
    }

    environment {
        FRONTEND_CONTAINER = 'online-shop-frontend-runtime'
        FRONTEND_IMAGE = 'online-shop-frontend'
        FRONTEND_PORT = '8084'
    }

    stages {

        stage('Checkout') {
            steps {
                echo '=== Checking out source code ==='
                checkout scm
            }
        }

        stage('Node Environment') {
            steps {
                echo '=== Node environment ==='
                sh 'node --version'
                sh 'npm --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '=== Installing locked dependencies ==='
                sh 'npm ci'
            }
        }

        stage('Security Audit') {
            steps {
                echo '=== Running npm security audit ==='
                sh 'npm audit --audit-level=high'
            }
        }

        stage('Build') {
            steps {
                echo '=== Building Vue/Vite production bundle ==='
                sh 'npm run build'
            }
        }

        stage('Verify Build') {
            steps {
                echo '=== Verifying production build ==='
                sh 'test -f dist/index.html'
                sh 'test -d dist/assets'
                echo 'Frontend production build verified successfully.'
            }
        }

        stage('Docker Build') {
            steps {
                sh '''
                    set -e

                    echo "=== Building frontend Docker image ==="

                    docker build \
                        -t "$FRONTEND_IMAGE:$BUILD_NUMBER" \
                        -t "$FRONTEND_IMAGE:latest" \
                        .

                    echo "Frontend Docker image built successfully."
                '''
            }
        }

        stage('Deploy Frontend') {
            steps {
                sh '''
                    set -e

                    echo "=== Deploying frontend container ==="

                    docker rm -f "$FRONTEND_CONTAINER" >/dev/null 2>&1 || true

                    docker run -d \
                        --name "$FRONTEND_CONTAINER" \
                        --restart unless-stopped \
                        --publish "$FRONTEND_PORT:80" \
                        "$FRONTEND_IMAGE:$BUILD_NUMBER"

                    echo "Frontend container started."
                '''
            }
        }

        stage('HTTP Health Check') {
            steps {
                sh '''
                    set -e

                    echo "=== Checking frontend HTTP endpoint ==="

                    for i in $(seq 1 30); do
                        if docker run --rm \
                            --network container:"$FRONTEND_CONTAINER" \
                            curlimages/curl:latest \
                            -fsS \
                            --connect-timeout 5 \
                            --max-time 10 \
                            http://127.0.0.1/ \
                            >/dev/null 2>&1; then

                            echo "Frontend HTTP health check passed."
                            exit 0
                        fi

                        echo "Waiting for frontend... attempt $i/30"
                        sleep 2
                    done

                    echo "Frontend failed HTTP health check."
                    docker logs "$FRONTEND_CONTAINER" || true
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            echo '=== ONLINE SHOP FRONTEND CI/CD PASSED ==='
            echo '=== Frontend deployed successfully ==='
        }

        failure {
            echo '=== ONLINE SHOP FRONTEND CI/CD FAILED ==='
        }

        always {
            echo '=== Jenkins pipeline completed ==='
        }

        cleanup {
            echo '=== Cleaning Jenkins workspace ==='
            deleteDir()
        }
    }
}
