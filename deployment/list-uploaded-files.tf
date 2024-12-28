resource "aws_lambda_function" "list_uploaded_files" {
  function_name = "${local.project}-list-uploaded-files"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  role          = aws_iam_role.list_uploaded_files.arn
  filename      = data.archive_file.list_uploaded_files.output_path

  source_code_hash = data.archive_file.list_uploaded_files.output_base64sha256

  environment {
    variables = {
      REGION               = local.region
      AUDIO_JOB_TABLE_NAME = aws_dynamodb_table.audio_job.name
    }
  }
}

resource "aws_iam_role" "list_uploaded_files" {
  name               = "${local.project}-list-uploaded-files"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role_policy_attachment" "list_uploaded_files_role_attachment" {
  role       = aws_iam_role.list_uploaded_files.name
  policy_arn = aws_iam_policy.list_uploaded_files_policy.arn
}

resource "aws_iam_policy" "list_uploaded_files_policy" {
  name = "${local.project}-list-uploaded-files"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:${local.region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Scan"
      ],
      "Resource": "${aws_dynamodb_table.audio_job.arn}"
    }
  ]
}
EOF
}

resource "aws_lambda_permission" "api_gw_list_uploaded_files" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.list_uploaded_files.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}


data "archive_file" "list_uploaded_files" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambdas/list-uploaded-files/dist"
  output_path = "artifacts/list-uploaded-files.zip"
}

