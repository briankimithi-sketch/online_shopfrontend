pipeline {
    agent any

    environment {
        NODE_ENV = 'production'
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
    }

    post {
        success {
            echo '=== ONLINE SHOP FRONTEND CI PASSED ==='
        }

        failure {
            echo '=== ONLINE SHOP FRONTEND CI FAILED ==='
        }

        always {
            echo '=== Jenkins pipeline completed ==='
        }

        cleanup {
            echo '=== Cleaning workspace ==='
            deleteDir()
        }
    }
}
