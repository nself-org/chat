{{/*
============================================================================
nself-chat Helm Template Helpers
============================================================================
*/}}

{{/*
Expand the name of the chart.
*/}}
{{- define "nself-chat.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "nself-chat.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "nself-chat.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "nself-chat.labels" -}}
helm.sh/chart: {{ include "nself-chat.chart" . }}
{{ include "nself-chat.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: nself
{{- end }}

{{/*
Selector labels
*/}}
{{- define "nself-chat.selectorLabels" -}}
app.kubernetes.io/name: {{ include "nself-chat.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "nself-chat.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "nself-chat.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the image reference
*/}}
{{- define "nself-chat.image" -}}
{{- $tag := default .Chart.AppVersion .Values.image.tag }}
{{- printf "%s:%s" .Values.image.repository $tag }}
{{- end }}

{{/*
Create secrets name
*/}}
{{- define "nself-chat.secretsName" -}}
{{- if .Values.secrets.existingSecret }}
{{- .Values.secrets.existingSecret }}
{{- else }}
{{- include "nself-chat.fullname" . }}-secrets
{{- end }}
{{- end }}

{{/*
Create configmap name
*/}}
{{- define "nself-chat.configmapName" -}}
{{- include "nself-chat.fullname" . }}-config
{{- end }}

{{/*
Return the appropriate apiVersion for HPA
*/}}
{{- define "nself-chat.hpa.apiVersion" -}}
{{- if .Capabilities.APIVersions.Has "autoscaling/v2" }}
{{- print "autoscaling/v2" }}
{{- else }}
{{- print "autoscaling/v2beta2" }}
{{- end }}
{{- end }}

{{/*
Return the appropriate apiVersion for PDB
*/}}
{{- define "nself-chat.pdb.apiVersion" -}}
{{- if .Capabilities.APIVersions.Has "policy/v1" }}
{{- print "policy/v1" }}
{{- else }}
{{- print "policy/v1beta1" }}
{{- end }}
{{- end }}

{{/*
GraphQL URL
*/}}
{{- define "nself-chat.graphqlUrl" -}}
{{- if .Values.externalServices.graphql.url }}
{{- .Values.externalServices.graphql.url }}
{{- else if .Values.postgresql.enabled }}
{{- printf "http://%s-hasura:8080/v1/graphql" .Release.Name }}
{{- else }}
{{- print "http://hasura:8080/v1/graphql" }}
{{- end }}
{{- end }}

{{/*
Auth URL
*/}}
{{- define "nself-chat.authUrl" -}}
{{- if .Values.externalServices.auth.url }}
{{- .Values.externalServices.auth.url }}
{{- else }}
{{- print "http://auth:4000" }}
{{- end }}
{{- end }}

{{/*
Storage URL
*/}}
{{- define "nself-chat.storageUrl" -}}
{{- if .Values.externalServices.storage.url }}
{{- .Values.externalServices.storage.url }}
{{- else }}
{{- print "http://storage:8000" }}
{{- end }}
{{- end }}
