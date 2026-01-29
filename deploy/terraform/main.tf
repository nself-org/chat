# ============================================================================
# nself-chat Terraform Configuration
# ============================================================================
# Infrastructure as Code for production deployment
# Supports: AWS, GCP, Azure
# ============================================================================

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Backend configuration for state storage
  backend "s3" {
    bucket         = "nself-chat-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "nself-chat-terraform-locks"
  }
}

# ============================================================================
# Variables
# ============================================================================

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  default     = "production"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "nself-chat-production"
}

variable "cluster_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "node_instance_type" {
  description = "EC2 instance type for worker nodes"
  type        = string
  default     = "t3.medium"
}

variable "min_nodes" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 3
}

variable "max_nodes" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 10
}

variable "desired_nodes" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 3
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage (GB)"
  type        = number
  default     = 100
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "nchat.example.com"
}

variable "enable_monitoring" {
  description = "Enable CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "enable_backups" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

# ============================================================================
# Locals
# ============================================================================

locals {
  name_prefix = "${var.environment}-nself-chat"
  common_tags = {
    Environment = var.environment
    Project     = "nself-chat"
    ManagedBy   = "Terraform"
    CostCenter  = "Engineering"
  }
}

# ============================================================================
# Data Sources
# ============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# ============================================================================
# Modules
# ============================================================================

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"

  name_prefix         = local.name_prefix
  vpc_cidr            = "10.0.0.0/16"
  availability_zones  = slice(data.aws_availability_zones.available.names, 0, 3)
  public_subnets      = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnets     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  database_subnets    = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]
  enable_nat_gateway  = true
  single_nat_gateway  = var.environment != "production"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = local.common_tags
}

# EKS Cluster
module "eks" {
  source = "./modules/eks"

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets

  node_groups = {
    main = {
      instance_types = [var.node_instance_type]
      min_size       = var.min_nodes
      max_size       = var.max_nodes
      desired_size   = var.desired_nodes
      disk_size      = 50

      labels = {
        role        = "worker"
        environment = var.environment
      }

      tags = merge(local.common_tags, {
        "k8s.io/cluster-autoscaler/enabled"                = "true"
        "k8s.io/cluster-autoscaler/${var.cluster_name}"    = "owned"
      })
    }
  }

  tags = local.common_tags
}

# RDS PostgreSQL Database
module "rds" {
  source = "./modules/rds"

  identifier             = "${local.name_prefix}-db"
  engine                 = "postgres"
  engine_version         = "16.1"
  instance_class         = var.db_instance_class
  allocated_storage      = var.db_allocated_storage
  max_allocated_storage  = var.db_allocated_storage * 2
  storage_encrypted      = true

  db_name  = "nchat"
  username = "nchat_admin"
  port     = 5432

  vpc_id               = module.vpc.vpc_id
  subnet_ids           = module.vpc.database_subnets
  allowed_cidr_blocks  = module.vpc.private_subnets_cidr_blocks

  backup_retention_period = var.enable_backups ? 30 : 0
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  monitoring_interval            = var.enable_monitoring ? 60 : 0

  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"
  final_snapshot_identifier = "${local.name_prefix}-db-final-snapshot"

  tags = local.common_tags
}

# ElastiCache Redis
module "redis" {
  source = "./modules/redis"

  cluster_id           = "${local.name_prefix}-redis"
  engine_version       = "7.0"
  node_type            = var.redis_node_type
  num_cache_nodes      = var.environment == "production" ? 2 : 1
  parameter_group_name = "default.redis7"
  port                 = 6379

  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnets
  allowed_cidr_blocks = module.vpc.private_subnets_cidr_blocks

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  snapshot_retention_limit = var.enable_backups ? 7 : 0
  snapshot_window         = "03:00-05:00"
  maintenance_window      = "Mon:05:00-Mon:07:00"

  tags = local.common_tags
}

# S3 Bucket for File Storage
module "s3" {
  source = "./modules/s3"

  bucket_name = "${local.name_prefix}-storage"

  versioning_enabled = true
  lifecycle_rules = [
    {
      id      = "delete-old-versions"
      enabled = true
      noncurrent_version_expiration = {
        days = 30
      }
    }
  ]

  cors_rules = [
    {
      allowed_headers = ["*"]
      allowed_methods = ["GET", "PUT", "POST", "DELETE"]
      allowed_origins = ["https://${var.domain_name}"]
      expose_headers  = ["ETag"]
      max_age_seconds = 3000
    }
  ]

  tags = local.common_tags
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/eks/${var.cluster_name}/application"
  retention_in_days = 30

  tags = local.common_tags
}

# ============================================================================
# Outputs
# ============================================================================

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
  sensitive   = true
}

output "cluster_certificate_authority_data" {
  description = "EKS cluster CA certificate"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "database_name" {
  description = "Database name"
  value       = module.rds.database_name
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.redis.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 bucket name for file storage"
  value       = module.s3.bucket_name
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = module.s3.bucket_arn
}
