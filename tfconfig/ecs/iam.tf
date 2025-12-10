
data "aws_iam_policy_document" "ecs-instance-policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs-instance-role" {
  name               = "tmcaa_ecs_instance_role"
  path               = "/"
  assume_role_policy = data.aws_iam_policy_document.ecs-instance-policy.json
}

resource "aws_iam_role_policy_attachment" "ecs-instance-role-attachment" {
  role       = aws_iam_role.ecs-instance-role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

resource "aws_iam_instance_profile" "ecs-instance-profile" {
  name = "tmcaa_ecs_instance_profile"
  path = "/"
  role = aws_iam_role.ecs-instance-role.id
}

resource "aws_iam_role" "ecs_task_exec_role" {
  name = "tmcaa_ecs_task_exec_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "ecs_agent_policy" {
  name = "tmcaa_ecs_agent_policy"

  policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Action = [
            "ecr:GetAuthorizationToken",
            "ecr:BatchCheckLayerAvailability",
            "ecr:GetDownloadUrlForLayer",
            "ecr:GetRepositoryPolicy",
            "ecr:DescribeRepositories",
            "ecr:ListImages",
            "ecr:DescribeImages",
            "ecr:BatchGetImage",
            "ecr:GetLifecyclePolicy",
            "ecr:GetLifecyclePolicyPreview",
            "ecr:ListTagsForResource",
            "ecr:DescribeImageScanFindings",
            "logs:PutLogEvents",
            "logs:CreateLogStream",
            "logs:CreateLogGroup",
            "ssm:GetParameter*",
            "kms:Decrypt",
            "secretsmanager:GetSecretValue",
            "secretsmanager:DescribeSecret",
          ]
          Effect   = "Allow"
          Resource = "*"
        },
      ]
    })
}


resource "aws_iam_role_policy_attachment" "ecs-agent-attach" {
  role       = aws_iam_role.ecs_task_exec_role.name
  policy_arn = aws_iam_policy.ecs_agent_policy.arn
}


# granting the permissions necessary for the applications
# running inside the task's containers. The permissions assigned to this role enable the containers to
# interact with AWS services that the application might need to access.

resource "aws_iam_role" "ecs_task_role" {
  name = "tmcaa_ecs_task_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "ecs_agent_ssm_policy" {
    name = "tmcaa_ecs_agent_policy"
    # ssmmessages:CreateControlChannel
    # - Enables the establishment of a control channel for managing interactions and command signals between AWS Systems Manager and your resources.

    # ssmmessages:CreateDataChannel 
    # - Allows the creation of a data channel for transferring data between Systems Manager and your resources during sessions.

    # ssmmessages:OpenControlChannel 
    # - Permits the opening of an established control channel to start communications for session management.

    # ssmmessages:OpenDataChannel 
    # - Facilitates the opening of an established data channel to enable the transfer of data during active sessions with Systems Manager.
    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Effect = "Allow",
          Action = [
            "ssmmessages:CreateControlChannel",
            "ssmmessages:CreateDataChannel",
            "ssmmessages:OpenControlChannel",
            "ssmmessages:OpenDataChannel",
            "ssm:GetParameter*",
            "states:StartExecution",
            "secretsmanager:GetSecretValue",
            "kms:Decrypt"
          ],
          Resource = "*"
        }
      ]
    })
}

resource "aws_iam_role_policy_attachment" "ecs-ssm-attach" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.ecs_agent_ssm_policy.arn
}